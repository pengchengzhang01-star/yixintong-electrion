import fs from "fs";
import { join, normalize } from "node:path";

import { logger } from "../main";
import { extractWithElevation } from "./common";

const cleanDir = async (targetPath: string) => {
  await fs.promises.rm(targetPath, { recursive: true, force: true });
};

const ensureDir = async (targetPath: string) => {
  await fs.promises.mkdir(targetPath, { recursive: true });
};

// Locate the folder with index.html inside the extracted package.
const resolveRendererRoot = (stagingRoot: string) => {
  const directIndex = join(stagingRoot, "index.html");
  if (fs.existsSync(directIndex)) {
    return stagingRoot;
  }
  const entries = fs.readdirSync(stagingRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const maybeRoot = join(stagingRoot, entry.name);
    if (fs.existsSync(join(maybeRoot, "index.html"))) {
      return maybeRoot;
    }
  }
  return "";
};

const pruneOldRendererAssets = async (basePath: string, reservedPaths: string[]) => {
  if (!fs.existsSync(basePath)) return;
  const reserved = new Set(reservedPaths.map((item) => normalize(item)));
  const candidates = fs
    .readdirSync(basePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = join(basePath, entry.name);
      return { fullPath, time: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.time - a.time);

  const toRemove = candidates.filter(
    (entry, index) => index >= 2 && !reserved.has(normalize(entry.fullPath)),
  );
  await Promise.all(
    toRemove.map((entry) =>
      fs.promises.rm(entry.fullPath, { recursive: true, force: true }),
    ),
  );
};

// Extract renderer bundle into a writable cache folder without touching the signed app.
export const applyRendererHotUpdate = async (pkgPath: string) => {
  const { rendererAssetsPath, rendererTempPath } = global.pathConfig;
  if (!rendererAssetsPath || !rendererTempPath) {
    logger.error("renderer hot update paths missing");
    return false;
  }
  const timestamp = Date.now();
  const versionTag = `renderer-${timestamp}`;
  const stagingRoot = join(rendererTempPath, `update-${timestamp}`);
  const targetPath = join(rendererAssetsPath, versionTag);

  try {
    await cleanDir(rendererTempPath);
    await ensureDir(stagingRoot);
    await ensureDir(rendererAssetsPath);
    await cleanDir(targetPath);

    const extracted = await extractWithElevation(pkgPath, stagingRoot).catch((error) => {
      logger.error("extract renderer hot update failed", error);
      return false;
    });
    if (!extracted) {
      await cleanDir(rendererTempPath);
      await ensureDir(rendererTempPath);
      return false;
    }

    const rendererRoot = resolveRendererRoot(stagingRoot);
    if (!rendererRoot) {
      await cleanDir(rendererTempPath);
      await ensureDir(rendererTempPath);
      logger.error("renderer hot update package missing index.html");
      return false;
    }

    await fs.promises.rename(rendererRoot, targetPath);
    await cleanDir(rendererTempPath);
    await ensureDir(rendererTempPath);

    logger.info("renderer hot update extracted", targetPath);
    await pruneOldRendererAssets(rendererAssetsPath, [
      targetPath,
      global.pathConfig.publicPath,
    ]);
    return true;
  } catch (error) {
    logger.error("applyRendererHotUpdate error", error);
    await cleanDir(rendererTempPath).catch(() => {});
    await ensureDir(rendererTempPath).catch(() => {});
    return false;
  }
};
