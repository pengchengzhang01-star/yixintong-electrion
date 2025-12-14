import fs from "fs";
import { join } from "node:path";
import { release } from "node:os";

import { app, powerMonitor, shell, systemPreferences } from "electron";

import { singleInstanceLock } from "../config";
import { IpcMainToRender } from "../constants";
import { isMac, isProd } from "../utils";
import { checkClearLogs } from "../utils/log";
import { cacheManager } from "./cacheManage";
import { getStore } from "./storeManage";
import { trayManager } from "./trayManage";
import { windowManager } from "./windowManage";
import { logger } from ".";

class AppManager {
  private store = getStore();

  prepare = () => {
    this.setSingleInstance();
    this.performAppStartup();
    this.setAppGlobalData();
  }

  setSingleInstance = () => {
    if (!singleInstanceLock) return;

    if (!app.requestSingleInstanceLock()) {
      app.quit();
      process.exit(0);
    }

    app.on("second-instance", () => {
      windowManager.showWindow();
    });
  }

  setAppListener = (startApp: () => void) => {
    app.on("web-contents-created", (event, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        if (!/^devtools/.test(url) && /^https?:\/\//.test(url)) {
          shell.openExternal(url);
        }
        return { action: "deny" };
      });
    });

    app.on("activate", () => {
      if (windowManager.isExistMainWindow()) {
        windowManager.showWindow();
      } else {
        startApp();
      }
    });

    app.on("window-all-closed", () => {
      if (isMac && !this.getIsForceQuit()) return;
      app.quit();
    });

    powerMonitor.on("suspend", () => {
      logger.debug("app suspend");
    });

    powerMonitor.on("resume", () => {
      logger.debug("app resume");
      windowManager.sendEvent(IpcMainToRender.appResume);
    });

    app.on("quit", () => {
      checkClearLogs();
      trayManager.flicker(false);
    });
  }

  performAppStartup = () => {
    app.setAppUserModelId(app.getName());
    app.commandLine.appendSwitch("--autoplay-policy", "no-user-gesture-required");
    app.commandLine.appendSwitch(
      "disable-features",
      "HardwareMediaKeyHandling,MediaSessionService",
    );

    if (release().startsWith("6.1")) app.disableHardwareAcceleration();
  }

  setAppGlobalData = () => {
    const {
      logsPath,
      autoUpdateCachePath,
      sdkResourcesPath,
      rendererAssetsPath,
      rendererTempPath,
    } = cacheManager.getBasePaths();
    const distRoot = join(__dirname, "../");
    const distPath = join(distRoot, "../dist");
    const defaultPublicPath = isProd ? distPath : join(distRoot, "../public");
    const publicPath = this.getRendererEntryPath(rendererAssetsPath, defaultPublicPath);
    const asarPath = process.resourcesPath;

    global.pathConfig = {
      publicPath,
      asarPath,
      logsPath,
      autoUpdateCachePath,
      extraResourcesPath: join(asarPath, "/extraResources"),
      sdkResourcesPath,
      appDistPath: distPath,
      rendererAssetsPath,
      rendererTempPath,
    };

    if (isProd) {
      cacheManager.ensureBaseDirs([
        global.pathConfig.logsPath,
        global.pathConfig.sdkResourcesPath,
        global.pathConfig.autoUpdateCachePath,
        global.pathConfig.rendererAssetsPath,
        global.pathConfig.rendererTempPath,
      ]);
    }
  }

  private getRendererEntryPath = (rendererAssetsPath: string, fallbackPath: string) => {
    if (!isProd) {
      return fallbackPath;
    }
    try {
      if (!fs.existsSync(rendererAssetsPath)) {
        return fallbackPath;
      }
      const candidates = fs
        .readdirSync(rendererAssetsPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
          const fullPath = join(rendererAssetsPath, entry.name);
          return {
            fullPath,
            indexPath: join(fullPath, "index.html"),
            time: fs.statSync(fullPath).mtimeMs,
          };
        })
        .filter((entry) => fs.existsSync(entry.indexPath))
        .sort((a, b) => b.time - a.time);
      return candidates[0]?.fullPath ?? fallbackPath;
    } catch (error) {
      logger.error("getRendererEntryPath failed", error);
      return fallbackPath;
    }
  }

  checkPreferences = () => {
    if (process.platform !== "darwin") {
      return;
    }
    const version = release().split(".")[0];
    if (Number(version) < 21) {
      return;
    }
    const privileges = [
      systemPreferences.getMediaAccessStatus("camera"),
      systemPreferences.getMediaAccessStatus("microphone"),
      systemPreferences.getMediaAccessStatus("screen"),
    ];

    privileges.map(async (privilege, idx) => {
      if (privilege !== "granted") {
        if (idx === 0) {
          await systemPreferences.askForMediaAccess("camera");
        }

        if (idx === 1) {
          await systemPreferences.askForMediaAccess("microphone");
        }
      }
    });
  }

  getIsForceQuit() {
    return this.store.get("closeAction") === "quit" || global.forceQuit;
  }
}

export const appManager = new AppManager();
