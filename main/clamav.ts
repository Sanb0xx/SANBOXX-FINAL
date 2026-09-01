import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export interface ScanResult {
  file: string;
  infected: boolean;
  signature: string | null;
  scannedAt: string;
}

function resolveClamScanCommand(): string {
  const configuredPath = process.env.CLAMSCAN_PATH?.trim();

  if (configuredPath) {
    return configuredPath;
  }

  if (process.platform === "win32" && process.env.ProgramFiles) {
    const standardInstall = path.join(
      process.env.ProgramFiles,
      "ClamAV",
      "clamscan.exe",
    );

    if (existsSync(standardInstall)) {
      return standardInstall;
    }
  }

  return "clamscan";
}

export function parseClamScanOutput(
  filePath: string,
  stdout: string,
): ScanResult {
  const foundMatch = stdout.match(/^.*: (.+) FOUND\r?$/m);

  return {
    file: filePath,
    infected: foundMatch !== null,
    signature: foundMatch?.[1] ?? null,
    scannedAt: new Date().toISOString(),
  };
}

export function scanFile(filePath: string): Promise<ScanResult> {
  const absoluteFilePath = path.resolve(filePath);
  const command = resolveClamScanCommand();

  return new Promise((resolve, reject) => {
    const process = spawn(command, ["--no-summary", "--stdout", absoluteFilePath], {
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";

    process.stdout.setEncoding("utf8");
    process.stderr.setEncoding("utf8");
    process.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    process.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    process.once("error", (error) => {
      reject(new Error(`Unable to start ClamAV at "${command}": ${error.message}`));
    });

    process.once("close", (exitCode) => {
      const result = parseClamScanOutput(absoluteFilePath, stdout);

      if (exitCode === 0) {
        resolve(result);
        return;
      }

      if (exitCode === 1 && result.infected) {
        resolve(result);
        return;
      }

      const details = stderr.trim() || stdout.trim() || "No output from clamscan";
      reject(new Error(`ClamAV exited with code ${exitCode}: ${details}`));
    });
  });
}
