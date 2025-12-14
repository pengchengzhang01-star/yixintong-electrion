import { trayManager } from "./trayManage";
import { appManager } from "./appManage";
import { shortcutManager } from "./shortcutManage";
import { app, BrowserWindow, dialog, shell } from "electron";
import { join } from "node:path";
import fs from "fs";

import OpenIMSDKMain from "@openim/electron-client-sdk";

import { IpcMainToRender } from "../constants";
import { enableCLib, maxInstanceCount, singleInstanceLock } from "../config";
import { isLinux, isMac, isWin } from "../utils";
import { initIMSDK } from "../utils/imsdk";
import { notificationManager } from "./notificationManage";
import { getStore } from "./storeManage";
import { downloadManager } from "./downloadManage";
import { logger } from ".";

class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private childWindowMap = new Map<string, number>();
  private splashWindow: BrowserWindow | null = null;
  private sdkInstance: OpenIMSDKMain | null = null;
  private cleanupDownloadTask: (() => void) | null = null;

  private createSplashWindow() {
    this.splashWindow = new BrowserWindow({
      frame: false,
      width: 200,
      height: 200,
      resizable: false,
      transparent: true,
    });
    this.splashWindow.loadFile(join(this.getRendererBasePath(), "splash.html"));
    this.splashWindow.on("closed", () => {
      this.splashWindow = null;
    });
  }

  private buildMainWindowOptions(): Electron.BrowserWindowConstructorOptions {
    return {
      title: app.getName(),
      icon: join(global.pathConfig.publicPath, "favicon.ico"),
      frame: false,
      show: false,
      width: 1024,
      height: 726,
      minWidth: 1024,
      minHeight: 726,
      titleBarStyle: "hiddenInset",
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        devTools: true,
        partition: this.getNextPartition(),
        webSecurity: false,
      },
    };
  }

  private loadWindowEntry(targetWindow: BrowserWindow, arg?: string, search?: string) {
    if (!app.isPackaged) {
      const hashPath = arg ? `/#/${arg}${search ? `?${search}` : ""}` : "";
      targetWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}${hashPath}`);
      return;
    }
    const basePath = this.getRendererBasePath();
    const loadOptions: Electron.LoadFileOptions | undefined = arg
      ? { hash: `/${arg}${search ? `?${search}` : ""}` }
      : undefined;
    targetWindow.loadFile(join(basePath, "index.html"), loadOptions);
  }

  private getRendererBasePath() {
    const preferred = global.pathConfig.publicPath;
    const fallback = global.pathConfig.appDistPath;
    const preferredEntry = join(preferred, "index.html");
    if (fs.existsSync(preferredEntry)) {
      return preferred;
    }
    const fallbackEntry = fallback ? join(fallback, "index.html") : "";
    if (fallbackEntry && fs.existsSync(fallbackEntry)) {
      global.pathConfig.publicPath = fallback;
      return fallback;
    }
    return preferred;
  }

  private attachMainWindowEvents(targetWindow: BrowserWindow) {
    targetWindow.webContents.on("did-finish-load", () => {
      targetWindow.webContents.send("main-process-message", new Date().toLocaleString());
    });

    targetWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith("https:") || url.startsWith("http:")) shell.openExternal(url);
      return { action: "deny" };
    });

    targetWindow.on("focus", () => {
      targetWindow.flashFrame(false);
      shortcutManager.register();
    });

    targetWindow.on("blur", () => {
      shortcutManager.unregisterAll();
    });

    targetWindow.on("close", (e) => {
      if (appManager.getIsForceQuit() || !targetWindow.isVisible()) {
        this.mainWindow = null;
        trayManager.destroyTray();
        this.clearChildWindows();
        this.cleanupDownloadTask?.();
        this.cleanupDownloadTask = null;
        return;
      }
      e.preventDefault();
      if (isMac && targetWindow.isFullScreen()) {
        targetWindow.setFullScreen(false);
      }
      targetWindow.hide();
    });
  }

  createMainWindow = () => {
    this.createSplashWindow();
    this.mainWindow = new BrowserWindow(this.buildMainWindowOptions());

    this.cleanupDownloadTask = downloadManager.registerSession(this.mainWindow.webContents, {
      setProgress: this.setProgressBar,
    });
    if (enableCLib) {
      this.sdkInstance = initIMSDK(this.mainWindow.webContents);
    }

    this.loadWindowEntry(this.mainWindow);
    this.attachMainWindowEvents(this.mainWindow);

    notificationManager.setClickHandler((conversationId) => {
      this.showWindow();
      this.sendEvent(IpcMainToRender.openConversation, conversationId);
    });
    return this.mainWindow;
  }

  splashEnd = () => {
    this.splashWindow?.close();
    this.mainWindow?.show();
  }

  createChildWindow = (
    arg: string,
    options?: Electron.BrowserWindowConstructorOptions,
    search?: string,
  ) => {
    const childWindow = new BrowserWindow({
      ...(options ?? {}),
      show: false,
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: false,
      },
    });

    childWindow.on("ready-to-show", () => {
      childWindow.show();
    });

    this.sdkInstance?.addWebContent(childWindow.webContents);
    downloadManager.registerSession(childWindow.webContents, {
      setProgress: this.setProgressBar,
    });
    this.loadWindowEntry(childWindow, arg, search);
    if (process.env.NODE_ENV === "development") {
      childWindow.webContents.openDevTools({
        mode: "detach",
      });
    }
    return childWindow;
  }


  getChildWindow = (key?: string) => {
    if (!key) return null;
    const windowId = this.childWindowMap.get(key);
    if (!windowId) return null;
    return BrowserWindow.getAllWindows().find((win) => win.id === windowId) || null;
  }

  deleteChildWindow = (key: string) => {
    this.childWindowMap.delete(key);
  }

  clearChildWindows = () => {
    this.childWindowMap.forEach((_, key) => {
      const childWindow = this.getChildWindow(key);
      if (!childWindow) {
        this.childWindowMap.delete(key);
        return;
      }
      if (!childWindow.isDestroyed()) {
        childWindow.close();
      }
      this.childWindowMap.delete(key);
    });
  }

  openChildWindowHandle = (props) => {
    const { arg, search, key, options } = props;
    let childWindow = this.getChildWindow(key);

    if (!childWindow) {
      childWindow = this.createChildWindow(arg, options, search);
      this.childWindowMap.set(key, childWindow.id);
      return;
    }

    logger.debug("openChildWindowHandle with key: ", key, "inMap: ", this.childWindowMap.get(key));
    logger.debug(
      "childWindow isMinimized",
      childWindow.isMinimized(),
      "isVisible",
      childWindow.isVisible(),
    );

    if (childWindow.isMinimized()) {
      childWindow.restore();
    }
    if (childWindow.isVisible()) {
      childWindow.focus();
    } else {
      childWindow.show();
    }
  }

  isExistMainWindow = (): boolean => {
    return !!this.mainWindow && !this.mainWindow?.isDestroyed();
  }

  isShowMainWindow = (): boolean => {
    if (!this.mainWindow) return false;
    return this.mainWindow.isVisible() && (isWin ? true : this.mainWindow.isFocused());
  }

  closeWindow = () => {
    this.mainWindow?.close();
  }

  hotReload = () => {
    this.mainWindow?.reload();
  }

  sendEvent = (name: string, ...args: any[]) => {
    if (!this.mainWindow) return;
    this.mainWindow.webContents.send(name, ...args);
  }

  showSelectDialog = async (options: Electron.OpenDialogOptions) => {
    if (!this.mainWindow) throw new Error("main window is undefined");
    return await dialog.showOpenDialog(this.mainWindow, options);
  }

  showDialog = (options: Electron.MessageBoxSyncOptions) => {
    if (!this.mainWindow) return;
    dialog.showMessageBoxSync(this.mainWindow, options);
  }

  showSaveDialog = async (options: Electron.SaveDialogOptions) => {
    if (!this.mainWindow) throw new Error("main window is undefined");
    return await dialog.showSaveDialog(this.mainWindow, options);
  }

  minimize = () => {
    this.mainWindow?.minimize();
  }

  updateMaximize = () => {
    if (!this.mainWindow) return;
    if (this.mainWindow.isMaximized()) {
      this.mainWindow.unmaximize();
    } else {
      this.mainWindow.maximize();
    }
  }

  toggleHide = () => {
    if (!this.mainWindow) return;
    this.mainWindow.isVisible() ? this.mainWindow.hide() : this.mainWindow.show();
  }

  toggleMinimize = () => {
    if (!this.mainWindow) return;
    if (this.mainWindow.isMinimized()) {
      if (!this.mainWindow.isVisible()) {
        this.mainWindow.show();
      }
      this.mainWindow.restore();
      this.mainWindow.focus();
    } else {
      this.mainWindow.minimize();
    }
  }

  showWindow = () => {
    if (!this.mainWindow) {
      this.createMainWindow();
      return;
    }
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    if (this.mainWindow.isVisible()) {
      this.mainWindow.focus();
    } else {
      this.mainWindow.show();
    }
  }

  hideWindow = () => {
    this.mainWindow?.hide();
  }

  toggleWindowVisible = (visible: boolean) => {
    if (!this.mainWindow) return;
    const opacity = this.mainWindow.getOpacity() ? 0 : 1;
    if (Boolean(opacity) !== visible) return;
    this.mainWindow.setOpacity(opacity);
  }

  setProgressBar = (progress: number, options?: Electron.ProgressBarOptions) => {
    this.mainWindow?.setProgressBar(progress, options);
  }

  taskFlicker = () => {
    if (
      isMac ||
      (this.mainWindow?.isVisible() && this.mainWindow?.isFocused() && !this.isExistMainWindow())
    )
      return;
    this.mainWindow?.flashFrame(true);
  }

  setIgnoreMouseEvents = (ignore: boolean, options?: Electron.IgnoreMouseEventsOptions) => {
    this.mainWindow?.setIgnoreMouseEvents(ignore, options);
  }

  toggleDevTools = () => {
    if (!this.mainWindow) return;
    if (this.mainWindow.webContents.isDevToolsOpened()) {
      this.mainWindow.webContents.closeDevTools();
    } else {
      this.mainWindow.webContents.openDevTools({
        mode: "detach",
      });
    }
  }

  setFullScreen = (isFullscreen: boolean): boolean => {
    if (!this.mainWindow) return false;
    if (isLinux) {
      if (isFullscreen) {
        this.mainWindow.setResizable(isFullscreen);
        this.mainWindow.setFullScreen(isFullscreen);
      } else {
        this.mainWindow.setFullScreen(isFullscreen);
        this.mainWindow.setResizable(isFullscreen);
      }
    } else {
      this.mainWindow.setFullScreen(isFullscreen);
    }
    return isFullscreen;
  }

  clearCache = async () => {
    if (!this.mainWindow) throw new Error("main window is undefined");
    await this.mainWindow.webContents.session.clearCache();
    await this.mainWindow.webContents.session.clearStorageData();
  }

  getCacheSize = async () => {
    if (!this.mainWindow) throw new Error("main window is undefined");
    return await this.mainWindow.webContents.session.getCacheSize();
  }

  getWebContents = (): Electron.WebContents => {
    if (!this.mainWindow) throw new Error("main window is undefined");
    return this.mainWindow.webContents;
  }

  getNextPartition = () => {
    if (singleInstanceLock) return "persist:part0";
    const store = getStore();
    let part = (store.get("partitionRandom") as number) || 0;
    if (isNaN(part)) part = 0;

    part = (part + 1) % maxInstanceCount;
    store.set("partitionRandom", part);
    const partition = `persist:part${part === 0 ? maxInstanceCount : part}`;
    return partition;
  }
}

export const windowManager = new WindowManager();
