import fs from "fs";
import { join } from "node:path";
import { app } from "electron";
import { extractWithElevation } from "./common";
import { isProd } from ".";

export const checkEmojiAssets = () => {
  if (!isProd) {
    return;
  }
  const userDataDir = join(app.getPath("userData"), `OpenIMData`);
  const emojiDir = join(userDataDir, "twemoji");
  const isDirExists = fs.existsSync(emojiDir);
  if (isDirExists) {
    return;
  }

  const zipPath = join(global.pathConfig.extraResourcesPath, "/assets/twemoji.zip");
  extractWithElevation(zipPath, userDataDir);
};
