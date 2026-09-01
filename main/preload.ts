import { contextBridge, ipcRenderer } from "electron";

import type { DetectionResult } from "./detection";

const DETECTION_RESULT_CHANNEL = "detection-result";

contextBridge.exposeInMainWorld("scanner", {
  onDetectionResult: (callback: (result: DetectionResult) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      result: DetectionResult,
    ) => {
      callback(result);
    };

    ipcRenderer.on(DETECTION_RESULT_CHANNEL, listener);

    return () => {
      ipcRenderer.removeListener(DETECTION_RESULT_CHANNEL, listener);
    };
  },
});
