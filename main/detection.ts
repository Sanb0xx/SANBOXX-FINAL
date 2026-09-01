import type { ScanResult } from "./clamav";
import type { Narration, NarrationSource } from "./narrator";

export interface DetectionResult {
  scan: ScanResult;
  narration: Narration;
  narrationSource: NarrationSource;
}
