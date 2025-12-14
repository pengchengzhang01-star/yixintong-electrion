import { Platform } from "@openim/wasm-client-sdk";
import { OverlayAPI } from "electron-capturer";

export type DataPath =
  | "public"
  | "emojiData"
  | "sdkResources"
  | "logsPath"
  | "fileCache"
  | "sentFileCache";

export interface PathConfig {
  publicPath: string;
  asarPath: string;
  logsPath: string;
  autoUpdateCachePath: string;
  extraResourcesPath: string;
  sdkResourcesPath: string;
  appDistPath: string;
  rendererAssetsPath: string;
  rendererTempPath: string;
  imageCachePath?: string;
  videoCachePath?: string;
  fileCachePath?: string;
  voiceCachePath?: string;
  avatarCachePath?: string;
  sentFileCachePath?: string;
  hotUpdateAssetPath?: string;
}

export type Unsubscribe = () => void;

type MessageBoxReturnType = Promise<number>;

export interface NewMessageSummary {
  conversationId: string;
  conversationName: string;
  senderName: string;
  text: string;
  isGroup?: boolean;
  isRtc?: boolean;
}

export interface IElectronAPI {
  // main -> render events
  onUpdateAvailable: (cb: () => void) => Unsubscribe;
  onUpdateNotAvailable: (cb: () => void) => Unsubscribe;
  onUpdateError: (cb: (error: any) => void) => Unsubscribe;
  onUpdateDownloadPaused: (cb: (...args: any[]) => void) => Unsubscribe;
  onUpdateDownloadFailed: (cb: (url: string, savePath?: string) => void) => Unsubscribe;
  onUpdateDownloadSuccess: (cb: (url: string, savePath: string) => void) => Unsubscribe;
  onUpdateDownloadProgress: (
    cb: (url: string, progress: number) => void,
  ) => Unsubscribe;
  onDownloadSuccess: (cb: (url: string, savePath: string) => void) => Unsubscribe;
  onDownloadFailed: (cb: (url: string, savePath?: string) => void) => Unsubscribe;
  onDownloadCancel: (cb: (url: string) => void) => Unsubscribe;
  onDownloadPaused: (cb: (url: string) => void) => Unsubscribe;
  onDownloadProgress: (cb: (url: string, progress: number) => void) => Unsubscribe;
  onEventTransfer: (cb: (payload: any) => void) => Unsubscribe;
  onAppResume: (cb: () => void) => Unsubscribe;
  onOpenConversation: (cb: (conversationId: string | null) => void) => Unsubscribe;

  // render -> main actions
  changeLanguage: (locale: string) => Promise<void>;
  mainWinReady: () => Promise<void>;
  showMainWindow: () => Promise<void>;
  openChildWindow: (props: any) => Promise<void>;
  clearSession: () => Promise<void>;
  minimizeWindow: (key?: string) => Promise<void>;
  maxmizeWindow: (key?: string) => Promise<void>;
  closeWindow: (key?: string) => Promise<void>;
  clearChildWindows: () => Promise<void>;
  showMessageBox: (options: any) => MessageBoxReturnType;
  setKeyStore: (params: { key: string; data: any }) => Promise<void>;
  getKeyStore: <T = unknown>(params: { key: string }) => Promise<T>;
  getKeyStoreSync: <T = unknown>(params: { key: string }) => T;
  getScreenSource: () => Promise<string | undefined>;
  startDownload: (url: string) => Promise<void>;
  pauseDownload: (url: string) => Promise<void>;
  resumeDownload: (url: string) => Promise<void>;
  cancelDownload: (url: string) => Promise<void>;
  showInputContextMenu: () => Promise<void>;
  updateUnreadCount: (count: number) => Promise<void>;
  triggerNewMessage: (msg: any) => Promise<void>;
  setUserCachePath: (userID: string) => Promise<void>;
  getDataPath: (key: DataPath) => string;
  dragFile: (filePath: string) => Promise<void>;
  appUpdate: (payload: { pkgPath: string; isHot: boolean }) => Promise<boolean>;
  showLogsInFinder: () => Promise<void>;
  prepareUploadLogs: () => Promise<string>;
  hotRelaunch: () => Promise<void>;
  sendEventTransfer: (payload: any) => Promise<void>;
  checkChildWindowStatus: (params: { key: string }) => Promise<boolean>;
  checkChildWindowStatusSync: (params: { key: string }) => boolean;
  checkMediaAccess: (device: "microphone" | "camera") => Promise<void>;
  oauthLogin: (options: {
    baseUrl: string;
    provider: "google" | "github";
  }) => Promise<any>;
  checkForUpdate: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  quitAndUpdate: () => Promise<void>;

  getVersion: () => string;
  getPlatform: () => Platform;
  getOsArch: () => string;
  getSystemVersion: () => string;
  fileExists: (path: string) => boolean;
  openFile: (path: string) => void;
  showInFinder: (path: string) => void;
  getTempFileURL: (path: string) => string;
  saveFileToDisk: (params: {
    file: File;
    type: "fileCache" | "sentFileCache";
    sync?: boolean;
  }) => Promise<string>;
  getFileByPath: (filePath: string) => Promise<File | null>;
  enableCLib: boolean;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
    electronCapturer?: OverlayAPI;
    userClick: (userID?: string, groupID?: string) => void;
    editRevoke: (clientMsgID: string) => void;
    screenshotPreview: (results: string) => void;
  }
  // main-process globals
  // eslint-disable-next-line no-var
  var pathConfig: PathConfig;
  // eslint-disable-next-line no-var
  var forceQuit: boolean;
}

declare module "i18next" {
  interface TFunction {
    (key: string, options?: object): string;
  }
}
