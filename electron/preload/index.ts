import fs from "fs";
import os from "os";
import path from "path";

import { contextBridge, ipcRenderer, shell } from "electron";

import "@openim/electron-client-sdk/lib/preload";
import "electron-capturer/preload";

import { DataPath, IElectronAPI } from "../../src/types/globalExpose.d";
import { IpcMainToRender, IpcRenderToMain } from "../constants";
import { enableCLib } from "../config";
import { isProd } from "../utils";
import { ensureDirSync, getUniqueSavePath } from "../utils/fs";

const buildListener =
  (channel: string) =>
  (callback: (...args: any[]) => void): (() => void) => {
    const subscription = (_: unknown, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  };

const eventListeners = {
  onUpdateAvailable: buildListener(IpcMainToRender.updateAvailable),
  onUpdateNotAvailable: buildListener(IpcMainToRender.updateNotAvailable),
  onUpdateError: buildListener(IpcMainToRender.updateError),
  onUpdateDownloadPaused: buildListener(IpcMainToRender.updateDownloadPaused),
  onUpdateDownloadFailed: buildListener(IpcMainToRender.updateDownloadFailed),
  onUpdateDownloadSuccess: buildListener(IpcMainToRender.updateDownloadSuccess),
  onUpdateDownloadProgress: buildListener(IpcMainToRender.updateDownloadProgress),
  onDownloadSuccess: buildListener(IpcMainToRender.downloadSuccess),
  onDownloadFailed: buildListener(IpcMainToRender.downloadFailed),
  onDownloadCancel: buildListener(IpcMainToRender.downloadCancel),
  onDownloadPaused: buildListener(IpcMainToRender.downloadPaused),
  onDownloadProgress: buildListener(IpcMainToRender.downloadProgress),
  onEventTransfer: buildListener(IpcMainToRender.eventTransfer),
  onAppResume: buildListener(IpcMainToRender.appResume),
  onOpenConversation: buildListener(IpcMainToRender.openConversation),
};

const invokeChannels: Record<string, string> = {
  changeLanguage: "changeLanguage",
  mainWinReady: "main-win-ready",
  showMainWindow: IpcRenderToMain.showMainWindow,
  openChildWindow: IpcRenderToMain.openChildWindow,
  clearSession: IpcRenderToMain.clearSession,
  minimizeWindow: IpcRenderToMain.minimizeWindow,
  maxmizeWindow: IpcRenderToMain.maxmizeWindow,
  closeWindow: IpcRenderToMain.closeWindow,
  clearChildWindows: IpcRenderToMain.clearChildWindows,
  showMessageBox: IpcRenderToMain.showMessageBox,
  setKeyStore: IpcRenderToMain.setKeyStore,
  getKeyStore: IpcRenderToMain.getKeyStore,
  getScreenSource: IpcRenderToMain.getScreenSource,
  startDownload: IpcRenderToMain.startDownload,
  pauseDownload: IpcRenderToMain.pauseDownload,
  resumeDownload: IpcRenderToMain.resumeDownload,
  cancelDownload: IpcRenderToMain.cancelDownload,
  showInputContextMenu: IpcRenderToMain.showInputContextMenu,
  updateUnreadCount: IpcRenderToMain.updateUnreadCount,
  triggerNewMessage: IpcRenderToMain.newMessageTrigger,
  setUserCachePath: IpcRenderToMain.setUserCachePath,
  dragFile: IpcRenderToMain.dragFile,
  appUpdate: IpcRenderToMain.appUpdate,
  showLogsInFinder: IpcRenderToMain.showLogsInFinder,
  prepareUploadLogs: IpcRenderToMain.prepareUploadLogs,
  hotRelaunch: IpcRenderToMain.hotRelaunch,
  sendEventTransfer: IpcRenderToMain.eventTransfer,
  checkChildWindowStatus: IpcRenderToMain.checkChildWindowStatus,
  checkMediaAccess: IpcRenderToMain.checkMediaAccess,
  oauthLogin: IpcRenderToMain.oauthLogin,
  checkForUpdate: IpcRenderToMain.checkForUpdate,
  downloadUpdate: IpcRenderToMain.downloadUpdate,
  quitAndUpdate: IpcRenderToMain.quitAndUpdate,
};

const syncChannels: Record<string, string> = {
  getKeyStoreSync: IpcRenderToMain.getKeyStoreSync,
  checkChildWindowStatusSync: IpcRenderToMain.checkChildWindowStatus,
};

const buildInvokeApi = (map: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(map).map(([name, channel]) => [
      name,
      (...args: any[]) => ipcRenderer.invoke(channel, ...args),
    ]),
  ) as any;

const buildSyncApi = (map: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(map).map(([name, channel]) => [
      name,
      (...args: any[]) => ipcRenderer.sendSync(channel, ...args),
    ]),
  ) as any;

const getPlatform = () => {
  if (process.platform === "darwin") {
    return 4;
  }
  if (process.platform === "win32") {
    return 3;
  }
  return 7;
};

const getOsArch = () => os.arch();

const getDataPath = (key: DataPath) => {
  if (!isProd) return "";
  return ipcRenderer.sendSync(IpcRenderToMain.getDataPath, key);
};

const fileExists = (targetPath: string) => fs.existsSync(targetPath);
const openFile = (targetPath: string) => shell.openPath(targetPath);
const showInFinder = (targetPath: string) => shell.showItemInFolder(targetPath);

const getTempFileURL = (targetPath: string) => {
  const file = fs.readFileSync(targetPath);
  const bolb = new Blob([file]);
  return URL.createObjectURL(bolb);
};

const saveFileToDisk = async ({
  file,
  type,
  sync,
}: {
  file: File;
  type: "fileCache" | "sentFileCache";
  sync?: boolean;
}): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const saveDir = ipcRenderer.sendSync(IpcRenderToMain.getDataPath, type);
  const savePath = path.join(saveDir, file.name);
  const uniqueSavePath = getUniqueSavePath(savePath);
  ensureDirSync(saveDir);
  if (sync) {
    await fs.promises.writeFile(uniqueSavePath, Buffer.from(arrayBuffer));
  } else {
    fs.promises.writeFile(uniqueSavePath, Buffer.from(arrayBuffer));
  }
  return uniqueSavePath;
};

const getFileByPath = async (filePath: string) => {
  try {
    const filename = path.basename(filePath);
    const data = await fs.promises.readFile(filePath);
    return new File([data], filename);
  } catch (error) {
    console.log(error);
    return null;
  }
};

const Api: IElectronAPI = {
  ...eventListeners,
  ...buildInvokeApi(invokeChannels),
  ...buildSyncApi(syncChannels),
  getDataPath,
  getVersion: () => process.version,
  getPlatform,
  getOsArch,
  getSystemVersion: process.getSystemVersion,
  fileExists,
  openFile,
  showInFinder,
  getTempFileURL,
  saveFileToDisk,
  getFileByPath,
  enableCLib,
};

contextBridge.exposeInMainWorld("electronAPI", Api);
