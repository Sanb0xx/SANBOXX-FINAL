import type { ScanResult } from "./clamav";

export const NARRATOR_SYSTEM_PROMPT = `You explain antivirus detections to non-technical endpoint operators.
Return only the requested JSON object. Use plain language, remain factual, and do not invent details beyond the scan result.
The severity is the real-world security risk from 0 to 100, not detection confidence.
If the signature is EICAR, clearly state that it is a harmless industry-standard antivirus test file, assign severity from 5 to 20, and explain that the successful detection confirms the scanner is working.
The explanation must contain 2-3 concise sentences. The recommendation must be one short action.`;

export function buildNarratorPrompt(scanResult: ScanResult): string {
  return `Explain this parsed ClamAV result:\n${JSON.stringify(scanResult)}`;
}
