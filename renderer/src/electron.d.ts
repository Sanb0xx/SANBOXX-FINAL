interface ScanResult {
  file: string;
  infected: boolean;
  signature: string | null;
  scannedAt: string;
}

interface Narration {
  severity: number;
  explanation: string;
  recommendation: string;
}

interface DetectionResult {
  scan: ScanResult;
  narration: Narration;
  narrationSource: "groq" | "fallback";
}

interface Window {
  scanner?: {
    onDetectionResult: (
      callback: (result: DetectionResult) => void,
    ) => () => void;
  };
}
