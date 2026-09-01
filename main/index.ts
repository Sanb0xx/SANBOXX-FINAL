import { app, BrowserWindow } from "electron";
import path from "node:path";

import type { FSWatcher } from "chokidar";

import type { DetectionResult } from "./detection";
import { DETECTION_RESULT_CHANNEL } from "./ipc";
import { narrateScan } from "./narrator";
import { watchDemoFolder } from "./watcher";

try {
  process.loadEnvFile(path.join(__dirname, "../../.env"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
    throw error;
  }
}

let mainWindow: BrowserWindow | null = null;
let demoFolderWatcher: FSWatcher | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: "#ffffff",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    console.log("Electron window ready");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  await createWindow();

  const demoFolder = path.join(app.getAppPath(), "demo-folder");
  demoFolderWatcher = watchDemoFolder(demoFolder, async (scan) => {
    console.log(`[scan] ${JSON.stringify(scan)}`);

    const narratorResult = await narrateScan(scan);
    const detectionResult: DetectionResult = {
      scan,
      narration: narratorResult.narration,
      narrationSource: narratorResult.source,
    };

    console.log(
      `[narrator] source=${narratorResult.source} latencyMs=${narratorResult.latencyMs} ${JSON.stringify(narratorResult.narration)}`,
    );
    mainWindow?.webContents.send(DETECTION_RESULT_CHANNEL, detectionResult);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow().catch((error: unknown) => {
        console.error("Failed to create Electron window", error);
      });
    }
  });
}).catch((error: unknown) => {
  console.error("Failed to start application", error);
  app.quit();
});

app.on("before-quit", () => {
  void demoFolderWatcher?.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
