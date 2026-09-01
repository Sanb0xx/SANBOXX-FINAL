import type { ScanResult } from "./clamav";
import { buildNarratorPrompt, NARRATOR_SYSTEM_PROMPT } from "./narrator-prompt";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";
const NARRATOR_TIMEOUT_MS = 6_000;

export interface Narration {
  severity: number;
  explanation: string;
  recommendation: string;
}

export type NarrationSource = "groq" | "fallback";

export interface NarratorResult {
  narration: Narration;
  source: NarrationSource;
  latencyMs: number;
}

export const INFECTED_FALLBACK_NARRATION: Narration = {
  severity: 15,
  explanation:
    "ClamAV detected the harmless EICAR antivirus test signature. The AI narrator is unavailable, but the detection confirms that the scanner is working.",
  recommendation: "Remove the EICAR test file after verification.",
};

export const CLEAN_FALLBACK_NARRATION: Narration = {
  severity: 0,
  explanation:
    "ClamAV completed the scan without detecting a known threat. The AI narrator is unavailable, but the antivirus result remains valid.",
  recommendation: "No action is required for this scan.",
};

interface GroqChatCompletion {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

function parseNarration(content: string): Narration {
  const value: unknown = JSON.parse(content);

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Groq returned a non-object narration");
  }

  const narration = value as Record<string, unknown>;
  const keys = Object.keys(narration).sort();

  if (keys.join(",") !== "explanation,recommendation,severity") {
    throw new Error("Groq returned an unexpected narration shape");
  }

  if (
    !Number.isInteger(narration.severity) ||
    (narration.severity as number) < 0 ||
    (narration.severity as number) > 100 ||
    typeof narration.explanation !== "string" ||
    narration.explanation.trim() === "" ||
    typeof narration.recommendation !== "string" ||
    narration.recommendation.trim() === ""
  ) {
    throw new Error("Groq returned invalid narration values");
  }

  return narration as unknown as Narration;
}

async function requestNarration(
  scanResult: ScanResult,
  apiKey: string,
): Promise<Narration> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NARRATOR_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: NARRATOR_SYSTEM_PROMPT },
          { role: "user", content: buildNarratorPrompt(scanResult) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "detection_narration",
            strict: true,
            schema: {
              type: "object",
              properties: {
                severity: { type: "integer", minimum: 0, maximum: 100 },
                explanation: { type: "string" },
                recommendation: { type: "string" },
              },
              required: ["severity", "explanation", "recommendation"],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.2,
        reasoning_effort: "low",
        max_completion_tokens: 512,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const details = (await response.text()).replace(/\s+/g, " ").trim();
      throw new Error(
        `Groq request failed with HTTP ${response.status}${details ? `: ${details.slice(0, 500)}` : ""}`,
      );
    }

    const completion = (await response.json()) as GroqChatCompletion;
    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty narration");
    }

    return parseNarration(content);
  } finally {
    clearTimeout(timeout);
  }
}

export async function narrateScan(scanResult: ScanResult): Promise<NarratorResult> {
  const startedAt = Date.now();

  try {
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    return {
      narration: await requestNarration(scanResult, apiKey),
      source: "groq",
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[narrator] Using fallback: ${message}`);

    return {
      narration: scanResult.infected
        ? INFECTED_FALLBACK_NARRATION
        : CLEAN_FALLBACK_NARRATION,
      source: "fallback",
      latencyMs: Date.now() - startedAt,
    };
  }
}
