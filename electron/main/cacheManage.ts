import fs from "fs";
import { join } from "node:path";

import { app } from "electron";

const OPENIM_DATA_DIR = "OpenIMData";

class CacheManager {
  private baseRoot = join(app.getPath("userData"), OPENIM_DATA_DIR);

  private ensureDir(dir: string) {
    return fs.promises
      .readdir(dir)
      .catch((err) => err.code === "ENOENT" && fs.promises.mkdir(dir, { recursive: true }));
  }

  getBasePaths = () => {
    return {
      baseRoot: this.baseRoot,
      logsPath: join(this.baseRoot, "logs"),
      autoUpdateCachePath: join(this.baseRoot, "autoUpdateCache"),
      rendererAssetsPath: join(this.baseRoot, "rendererAssets"),
      rendererTempPath: join(this.baseRoot, "rendererTemp"),
      sdkResourcesPath: join(this.baseRoot, "sdkResources"),
    };
  }

  getEmojiDir = () => {
    return join(this.baseRoot, "twemoji");
  }

  ensureBaseDirs = (paths: string[]) => {
    paths.forEach((dir) => void this.ensureDir(dir));
  }

  setUserCachePath = (userID: string) => {
    const root = join(this.baseRoot, userID);
    const cachePaths = {
      imageCachePath: join(root, "imageCache"),
      videoCachePath: join(root, "videoCache"),
      fileCachePath: join(root, "fileCache"),
      voiceCachePath: join(root, "voiceCache"),
      avatarCachePath: join(root, "avatarCache"),
      sentFileCachePath: join(root, "sentFileCache"),
    };
    Object.values(cachePaths).forEach((dir) => void this.ensureDir(dir));
    Object.assign(global.pathConfig, cachePaths);
  }
}

export const cacheManager = new CacheManager();
