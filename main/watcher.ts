import chokidar, { type FSWatcher } from "chokidar";

import { scanFile, type ScanResult } from "./clamav";

const SCAN_DEBOUNCE_MS = 300;

export function watchDemoFolder(
  folderPath: string,
  onScanResult: (result: ScanResult) => void | Promise<void>,
): FSWatcher {
  const pendingScans = new Map<string, NodeJS.Timeout>();
  const watcher = chokidar.watch(folderPath, {
    awaitWriteFinish: {
      stabilityThreshold: 250,
      pollInterval: 50,
    },
    depth: 0,
    ignored: /(^|[/\\])\../,
    ignoreInitial: true,
  });

  const scheduleScan = (filePath: string) => {
    const pendingScan = pendingScans.get(filePath);

    if (pendingScan) {
      clearTimeout(pendingScan);
    }

    pendingScans.set(
      filePath,
      setTimeout(() => {
        pendingScans.delete(filePath);
        void scanFile(filePath).then(onScanResult).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[scan] Failed to scan ${filePath}: ${message}`);
        });
      }, SCAN_DEBOUNCE_MS),
    );
  };

  watcher.on("add", scheduleScan);
  watcher.on("change", scheduleScan);
  watcher.on("error", (error) => {
    console.error(`[watcher] ${String(error)}`);
  });
  watcher.on("ready", () => {
    console.log(`[watcher] Watching ${folderPath}`);
  });

  return watcher;
}
