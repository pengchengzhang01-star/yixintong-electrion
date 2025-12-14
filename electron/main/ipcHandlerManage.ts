import { appManager } from "./appManage";
import { cacheManager } from "./cacheManage";
import { trayManager } from "./trayManage";
import fs from "fs";
import { exec as execCommond } from "child_process";
import { join } from "path";

import {
  BrowserWindow,
  Menu,
  app,
  desktopCapturer,
  dialog,
  ipcMain,
  shell,
  systemPreferences,
} from "electron";
import zipUtil from "adm-zip";
import { t } from "i18next";

import { changeLanguage } from "../i18n";
import { IpcMainToRender, IpcRenderToMain } from "../constants";
import { applyRendererHotUpdate } from "../utils/hotUpdater";
import { createOAuthWindow } from "../utils/oauth";
import { getStore } from "./storeManage";
import { notificationManager } from "./notificationManage";
import { logger } from ".";
import { windowManager } from "./windowManage";
import { downloadManager } from "./downloadManage";

class IpcHandlerManager {
  private store = getStore();

  private getDataPathByKey(key: string) {
    switch (key) {
      case "public":
        return global.pathConfig.publicPath;
      case "fileCache":
        return global.pathConfig.fileCachePath;
      case "sentFileCache":
        return global.pathConfig.sentFileCachePath;
      case "emojiData": {
        const emojiDir = cacheManager.getEmojiDir();
        return fs.existsSync(emojiDir) ? emojiDir : "";
      }
      case "sdkResources":
        return global.pathConfig.sdkResourcesPath;
      case "logsPath":
        return global.pathConfig.logsPath;
      default:
        return global.pathConfig.publicPath;
    }
  }

  private forwardEvent(args) {
    if (args.args.target === "main") {
      windowManager.sendEvent(IpcMainToRender.eventTransfer, args);
      return;
    }
    const childWindow = windowManager.getChildWindow(args.args.target);
    if (!childWindow) {
      logger.debug("eventTransfer target missing", args.args.target);
      return;
    }
    childWindow.webContents.send(IpcMainToRender.eventTransfer, args);
  }

  private async handleCheckMediaAccess(_: unknown, device: 'microphone' | 'camera') {
    if (process.platform === "linux") return;

    const status = systemPreferences.getMediaAccessStatus(device);
    logger.debug("checkMediaAccess", device, status);
    if (status === "granted") return;

    if (status === "denied") {
      const privacyTypeObjOfMac = {
        camera: "Privacy_Camera",
        microphone: "Privacy_Microphone",
        tips: "system.cameraPrivacyDenied",
      };
      const privacyTypeObjOfWindows = {
        camera: "privacy-webcam",
        microphone: "privacy-microphone",
        tips: "system.microphonePrivacyDenied",
      };
      windowManager.showDialog({
        type: "warning",
        message: t(privacyTypeObjOfWindows.tips),
      });
      if (process.platform === "darwin") {
        execCommond(
          `open x-apple.systempreferences:com.apple.preference.security?${privacyTypeObjOfMac[device]}`,
        );
      } else {
        execCommond(`start ms-settings:${privacyTypeObjOfWindows[device]}`);
      }
      return;
    }
    await systemPreferences.askForMediaAccess(device);
  }

  private registerWindowHandlers() {
    ipcMain.handle("changeLanguage", (_, locale) => {
      this.store.set("language", locale);
      changeLanguage(locale).then(() => {
        app.relaunch();
        app.exit(0);
      });
    });
    ipcMain.handle("main-win-ready", windowManager.splashEnd);
    ipcMain.handle(IpcRenderToMain.showMainWindow, windowManager.showWindow);
    ipcMain.handle(IpcRenderToMain.openChildWindow, (_, props) => {
      windowManager.openChildWindowHandle(props);
    });
    ipcMain.on(IpcRenderToMain.checkChildWindowStatus, (e, { key }) => {
      e.returnValue = Boolean(windowManager.getChildWindow(key));
    });
    ipcMain.handle(IpcRenderToMain.minimizeWindow, (_, key) => {
      const childWindow = windowManager.getChildWindow(key);
      if (childWindow) {
        childWindow.minimize();
        return;
      }
      windowManager.minimize();
    });
    ipcMain.handle(IpcRenderToMain.maxmizeWindow, (_, key) => {
      const childWindow = windowManager.getChildWindow(key);
      if (childWindow) {
        if (childWindow.isMaximized()) {
          childWindow.unmaximize();
        } else {
          childWindow.maximize();
        }
        return;
      }
      windowManager.updateMaximize();
    });
    ipcMain.handle(IpcRenderToMain.closeWindow, (_, key) => {
      const childWindow = windowManager.getChildWindow(key);
      if (!childWindow) {
        windowManager.closeWindow();
        return;
      }
      if (childWindow.isDestroyed()) {
        windowManager.deleteChildWindow(key);
        return;
      }
      childWindow.close();
      windowManager.deleteChildWindow(key);
    });
    ipcMain.handle(IpcRenderToMain.clearChildWindows, () => {
      windowManager.clearChildWindows();
    });
    ipcMain.handle(IpcRenderToMain.eventTransfer, (_, args) => {
      this.forwardEvent(args);
    });
  }

  private registerDialogsHandlers() {
    ipcMain.handle(IpcRenderToMain.showMessageBox, (_, options) =>
      dialog
        .showMessageBox(BrowserWindow.getFocusedWindow(), options)
        .then((res) => res.response),
    );
    ipcMain.handle(IpcRenderToMain.checkMediaAccess, this.handleCheckMediaAccess.bind(this));
    ipcMain.handle(IpcRenderToMain.oauthLogin, async (_, options) => {
      try {
        const result = await createOAuthWindow(options);
        return { success: true, data: result };
      } catch (error) {
        logger.error("oauthLogin failed", error);
        return { success: false };
      }
    });
    ipcMain.handle(IpcRenderToMain.showInputContextMenu, () => {
      const menu = Menu.buildFromTemplate([
        {
          label: t("system.copy"),
          type: "normal",
          role: "copy",
          accelerator: "CommandOrControl+c",
        },
        {
          label: t("system.paste"),
          type: "normal",
          role: "paste",
          accelerator: "CommandOrControl+v",
        },
        {
          label: t("system.selectAll"),
          type: "normal",
          role: "selectAll",
          accelerator: "CommandOrControl+a",
        },
      ]);
      menu.popup({
        window: BrowserWindow.getFocusedWindow()!,
      });
    });
  }

  private registerStoreHandlers() {
    ipcMain.handle(IpcRenderToMain.setKeyStore, (_, { key, data }) => {
      this.store.set(key, data);
    });
    ipcMain.handle(IpcRenderToMain.getKeyStore, (_, { key }) => this.store.get(key));
    ipcMain.on(IpcRenderToMain.getKeyStoreSync, (e, { key }) => {
      e.returnValue = this.store.get(key);
    });
  }

  private registerTrayAndNoticeHandlers() {
    ipcMain.handle(IpcRenderToMain.updateUnreadCount, (_, count) => {
      app.setBadgeCount(count);
      trayManager.setTrayTitle(count);
      trayManager.flicker(count > 0);
    });
    ipcMain.handle(IpcRenderToMain.newMessageTrigger, (_, msg) => {
      windowManager.taskFlicker();
      notificationManager.handleNewMessage(msg);
    });
  }

  private registerDownloadHandlers() {
    ipcMain.handle(IpcRenderToMain.startDownload, (ev, url: string) =>
      downloadManager.startDownload(ev, url),
    );

    ipcMain.handle(IpcRenderToMain.pauseDownload, (event, url: string) =>
      downloadManager.pauseDownload(event, url),
    );

    ipcMain.handle(IpcRenderToMain.resumeDownload, (event, url: string) =>
      downloadManager.resumeDownload(event, url),
    );

    ipcMain.handle(IpcRenderToMain.cancelDownload, (event, url: string) =>
      downloadManager.cancelDownload(event, url),
    );
  }

  private registerUpdateHandlers() {
    ipcMain.handle(IpcRenderToMain.appUpdate, async (_, { pkgPath, isHot }) => {
      if (isHot) {
        const flag = await applyRendererHotUpdate(pkgPath);
        logger.debug("applyRendererHotUpdate flag", flag);
        if (flag) {
          fs.unlink(pkgPath, () => {});
        }
        return flag;
      }
      shell.openPath(pkgPath);
      return true;
    });
    ipcMain.handle(IpcRenderToMain.hotRelaunch, async () => {
      app.relaunch();
      app.exit(0);
    });
    ipcMain.handle(IpcRenderToMain.setUserCachePath, (_, userID) => {
      cacheManager.setUserCachePath(userID);
    });
  }

  private registerPathHandlers() {
    ipcMain.on(IpcRenderToMain.getDataPath, (e, key: string) => {
      e.returnValue = this.getDataPathByKey(key);
    });
    ipcMain.handle(IpcRenderToMain.dragFile, (e, filePath) => {
      e.sender.startDrag({
        file: filePath,
        icon: trayManager.trayIconPath,
      });
    });
    ipcMain.handle(IpcRenderToMain.showLogsInFinder, () => {
      shell.openPath(global.pathConfig.logsPath);
    });
    ipcMain.handle(IpcRenderToMain.prepareUploadLogs, async () => {
      const logsPath = global.pathConfig.logsPath;
      const zip = new zipUtil();
      zip.addLocalFolder(logsPath);
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const zipPath = join(global.pathConfig.logsPath, `${dateStr}electronlog.zip`);
      await zip.writeZipPromise(zipPath);
      return zipPath;
    });
  }

  private registerScreenHandlers() {
    ipcMain.handle(IpcRenderToMain.getScreenSource, async () => {
      const sources = await desktopCapturer.getSources({ types: ["screen"] });
      return sources[0]?.id;
    });
  }

  private registerSessionHandlers() {
    ipcMain.handle(IpcRenderToMain.clearSession, windowManager.clearCache);
  }

  setIpcMainListener = () => {
    this.registerSessionHandlers();
    this.registerWindowHandlers();
    this.registerDialogsHandlers();
    this.registerStoreHandlers();
    this.registerTrayAndNoticeHandlers();
    this.registerDownloadHandlers();
    this.registerUpdateHandlers();
    this.registerPathHandlers();
    this.registerScreenHandlers();
  }
}

export const ipcHandlerManager = new IpcHandlerManager();
