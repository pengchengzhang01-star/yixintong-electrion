import { Platform } from "@openim/wasm-client-sdk";
import { v4 as uuidv4 } from "uuid";

import { getChatUrl } from "@/config";
import createAxiosInstance from "@/utils/request";

const request = createAxiosInstance(getChatUrl());

export const checkUpdatePkg = async (): Promise<{
  data: {
    version: API.AutoUpdate.Version;
  };
}> => {
  let platform = "windows";
  const platformID = window.electronAPI?.getPlatform();
  if (platformID === Platform.Linux) {
    platform = "linux";
  }
  if (platformID === Platform.MacOSX) {
    platform = "mac";
  }
  const osArch = window.electronAPI?.getOsArch() || "";
  return request({
    url: "/application/latest_version",
    method: "POST",
    data: {
      platform: `electron_${platform}_${osArch}`,
      version: "",
    },
    headers: {
      operationID: uuidv4(),
    },
  });
};
