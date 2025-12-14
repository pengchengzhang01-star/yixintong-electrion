import fs from "fs";
import path from "node:path";

export const ensureDirSync = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const getUniqueSavePath = (originalPath: string) => {
  let counter = 0;
  let savePath = originalPath;
  const fileDir = path.dirname(originalPath);
  const fileExt = path.extname(originalPath);
  const baseName = path.basename(originalPath, fileExt);

  while (fs.existsSync(savePath)) {
    counter++;
    savePath = path.join(fileDir, `${baseName}(${counter})${fileExt}`);
  }

  return savePath;
};

export const removeFileAndEmptyDir = (filePath: string) => {
  if (!fs.existsSync(filePath)) return;

  const tempFileDir = path.dirname(filePath);
  try {
    fs.unlinkSync(filePath);
  } catch {
    return;
  }

  try {
    if (fs.readdirSync(tempFileDir).length === 0) {
      fs.rmdirSync(tempFileDir);
    }
  } catch {
    // ignore cleanup errors
  }
};
