import fs from "fs";
import { join, normalize } from "node:path";
import sudo from "sudo-prompt";
import zipUtil from "adm-zip";

import { logger } from "../main";

export const extractWithElevation = (zipPath: string, outputPath: string) => {
  const canWrite = checkWritePermission(outputPath);
  logger.debug("extractWithElevation canWrite", canWrite);
  if (canWrite) {
    const prevNoAsar = process.noAsar;
    try {
      process.noAsar = true;
      const task = new zipUtil(zipPath);
      task.extractAllTo(outputPath, true);
      return Promise.resolve(true);
    } catch (error) {
      logger.error("extractWithElevation error");
      logger.error(error);
      return Promise.reject(false);
    } finally {
      process.noAsar = prevNoAsar;
    }
  }
  const scriptPath = join(__dirname, "../scripts/unzipTask.js");
  const electronExecutable = process.execPath;
  const command = `"${normalize(electronExecutable)}" "${normalize(
    scriptPath,
  )}" "${normalize(zipPath)}" "${normalize(outputPath)}"`;
  return sudoExec(command);
};

export const sudoExec = (command: string) => {
  return new Promise<boolean>((resolve, reject) => {
    logger.debug("sudo exec command: ", command);
    const env = getCleanedEnv();
    sudo.exec(
      command,
      {
        name: "OpenCorp",
        env: {
          ...env,
          ELECTRON_RUN_AS_NODE: "1",
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          logger.error("sudoExec error");
          logger.error(error, stdout, stderr);
          reject(false);
          return;
        }
        resolve(true);
      },
    );
  });
};

export const checkWritePermission = (path: string) => {
  try {
    fs.writeFileSync(join(path, "write.txt"), "w");
    fs.unlinkSync(join(path, "write.txt"));
    return true;
  } catch (err) {
    return false;
  }
};

const getCleanedEnv = () => {
  const cleanedEnv = { ...process.env };
  for (const key of Object.keys(cleanedEnv)) {
    if (/[()]/.test(key)) {
      delete cleanedEnv[key];
    }
  }
  return cleanedEnv;
};
