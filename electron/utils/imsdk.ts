import path from "path";
import os from "os";
import OpenIMSDKMain from "@openim/electron-client-sdk";
import { WebContents } from "electron";
import { isProd } from ".";

export const getLibSuffix = () => {
  const platform = process.platform;
  const arch = os.arch();
  if (platform === "darwin") {
    return path.join(`mac_${arch === "arm64" ? "arm64" : "x64"}`, "libopenimsdk.dylib");
  }
  if (platform === "win32") {
    return path.join(`win_${arch === "ia32" ? "ia32" : "x64"}`, "libopenimsdk.dll");
  }
  return path.join(`linux_${arch === "arm64" ? "arm64" : "x64"}`, "libopenimsdk.so");
};

const prodLibPath = path.join(
  process.resourcesPath,
  "/app.asar.unpacked/node_modules/@openim/electron-client-sdk/assets",
);
const devLibPath = path.join(__dirname, "../../node_modules/@openim/electron-client-sdk/assets");

export const imsdkLibPath = isProd ? prodLibPath : devLibPath 


export const initIMSDK = (webContents: WebContents) =>
  new OpenIMSDKMain(
    path.join(imsdkLibPath, getLibSuffix()),
    webContents,
    true,
  );
