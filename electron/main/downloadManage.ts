import path from "path";

import { IpcMainToRender } from "../constants";
import { getUniqueSavePath, removeFileAndEmptyDir } from "../utils/fs";

interface SearchObjectType {
  "is-update"?: string;
  "save-type"?: string;
  "random-prefix"?: string;
}

const customTypes = ["image", "video", "avatar", "voice"];

class DownloadManager {
  private downloadItems = new Map<string, Electron.DownloadItem>();
  private pausedItems = new Set<Electron.DownloadItem>();

  registerSession = (
    webContents: Electron.WebContents,
    hooks?: { setProgress?: (progress: number) => void },
  ) => {
    const webContentsSend = (channel: string, ...args: any[]) => {
      if (webContents.isDestroyed()) return;
      webContents.send(channel, ...args);
    };

    const handleWillDownload = (_: Electron.Event, item: Electron.DownloadItem) => {
      const realUrl = this.getRealUrl(item);
      this.downloadItems.set(realUrl, item);

      const searchParams = new URL(realUrl).searchParams;
      const searchObject = {} as SearchObjectType;

      for (const [key, value] of searchParams.entries()) {
        searchObject[key] = value;
      }
      const isUpdate = !!searchObject["is-update"];

      if (isUpdate) {
        item.setSavePath(
          path.join(global.pathConfig.autoUpdateCachePath, item.getFilename()),
        );
      } else {
        const fileType = this.getFileType(searchObject["save-type"]);
        const fileNamePrefix = searchObject["random-prefix"] ?? "";
        const savePath = path.join(
          global.pathConfig[`${fileType}CachePath`],
          `${fileNamePrefix}${item.getFilename()}`,
        );
        const uniqueSavePath = getUniqueSavePath(savePath);
        item.setSavePath(uniqueSavePath);
      }

      item.on("updated", (_, state) => {
        if (state === "interrupted") {
          if (!this.pausedItems.has(item)) {
            webContentsSend(
              IpcMainToRender[isUpdate ? "updateDownloadFailed" : "downloadFailed"],
              realUrl,
              item.getSavePath(),
            );
            return;
          }
          webContentsSend(
            IpcMainToRender[isUpdate ? "updateDownloadPaused" : "downloadPaused"],
            realUrl,
          );
        } else if (state === "progressing") {
          if (!item.isPaused()) {
            const receivedBytes = item.getReceivedBytes();
            const totalBytes = item.getTotalBytes();
            const progress = Math.round((receivedBytes / totalBytes) * 100);
            webContentsSend(
              IpcMainToRender[isUpdate ? "updateDownloadProgress" : "downloadProgress"],
              realUrl,
              progress,
            );
            if (isUpdate) hooks?.setProgress?.(progress);
          }
        }
      });

      item.once("done", (_, state) => {
        const successEvent =
          IpcMainToRender[isUpdate ? "updateDownloadSuccess" : "downloadSuccess"];
        const failedEvent =
          IpcMainToRender[isUpdate ? "updateDownloadFailed" : "downloadFailed"];
        webContentsSend(
          state === "completed" ? successEvent : failedEvent,
          realUrl,
          item.getSavePath(),
        );
        if (state === "completed" && isUpdate) {
          global.pathConfig.hotUpdateAssetPath = item.getSavePath();
        }

        if (isUpdate) hooks?.setProgress?.(-1);

        this.downloadItems.delete(realUrl);
        this.pausedItems.delete(item);
      });
    };

    webContents.session.on("will-download", handleWillDownload);

    return () => {
      webContents.session.removeListener("will-download", handleWillDownload);
      Array.from(this.downloadItems.values()).forEach((item) => {
        item.cancel();
        removeFileAndEmptyDir(item.getSavePath());
      });
      this.downloadItems.clear();
      this.pausedItems.clear();
    };
  }

  startDownload = (ev: Electron.IpcMainInvokeEvent, url: string) => {
    ev.sender.session.downloadURL(url);
  }

  pauseDownload = (_: Electron.IpcMainInvokeEvent, url: string) => {
    const item = this.downloadItems.get(url);
    if (item && !item.isPaused()) {
      item.pause();
      this.pausedItems.add(item);
    }
  }

  resumeDownload = (_: Electron.IpcMainInvokeEvent, url: string) => {
    const item = this.downloadItems.get(url);
    if (item && item.isPaused()) {
      item.resume();
      this.removePausedItem(item);
    }
  }

  cancelDownload = (_: Electron.IpcMainInvokeEvent, url: string) => {
    const item = this.downloadItems.get(url);
    if (item) {
      item.cancel();
      this.dropDownload(item);
      this.removePausedItem(item);
    }
  }

  private dropDownload = (item: Electron.DownloadItem) => {
    const url = this.getRealUrl(item);
    this.downloadItems.delete(url);
    removeFileAndEmptyDir(item.getSavePath());
  }

  private removePausedItem = (item: Electron.DownloadItem) => {
    this.pausedItems.delete(item);
  }

  private getFileType = (type?: string) => {
    return customTypes.includes(type ?? "") ? type : "file";
  }

  private getRealUrl = (item: Electron.DownloadItem) => {
    return item.getURLChain()[0];
  }
}

export const downloadManager = new DownloadManager();
