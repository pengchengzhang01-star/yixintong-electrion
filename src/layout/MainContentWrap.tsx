import {
  getWithRenderProcess,
  IMSDKInterface,
} from "@openim/electron-client-sdk/lib/render";
import { getSDK } from "@openim/wasm-client-sdk";
import { AllowType } from "@openim/wasm-client-sdk";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import AutoUpdateModal from "@/pages/common/AutoUpdateModal";
import { useConversationStore, useUserStore } from "@/store";
import { emit } from "@/utils/events";
import { checkNotificationPermission } from "@/utils/imCommon";
import { getIMToken, getIMUserID } from "@/utils/storage";

const isElectronProd = import.meta.env.MODE !== "development" && window.electronAPI;

let openIMSDK: IMSDKInterface;

if (window.electronAPI?.enableCLib) {
  const { instance } = getWithRenderProcess({
    wasmConfig: {
      coreWasmPath: "./openIM.wasm",
      sqlWasmPath: `/sql-wasm.wasm`,
    },
  });
  openIMSDK = instance;
} else {
  // @ts-ignore
  openIMSDK = getSDK({
    coreWasmPath: "./openIM.wasm",
    sqlWasmPath: `${isElectronProd ? ".." : ""}/sql-wasm.wasm`,
  });
}

export const IMSDK = openIMSDK;

export const MainContentWrap = () => {
  const updateAppSettings = useUserStore((state) => state.updateAppSettings);
  const initImageCache = useUserStore((state) => state.initImageCache);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loginCheck = async () => {
      const IMToken = await getIMToken();
      const IMUserID = await getIMUserID();
      if (!IMToken || !IMUserID) {
        navigate("/login");
        return;
      }
    };

    loginCheck();
  }, [location.pathname]);

  useEffect(() => {
    window.userClick = (userID?: string, groupID?: string) => {
      if (!userID || userID === "AtAllTag") return;

      const currentGroupInfo = useConversationStore.getState().currentGroupInfo;

      if (groupID && currentGroupInfo?.lookMemberInfo === AllowType.NotAllowed) {
        return;
      }

      emit("OPEN_USER_CARD", {
        userID,
        groupID,
        notAdd:
          Boolean(groupID) &&
          currentGroupInfo?.applyMemberFriend === AllowType.NotAllowed,
      });
    };
  }, []);

  useEffect(() => {
    const initSettingStore = () => {
      if (!window.electronAPI) return;
      updateAppSettings({
        closeAction:
          window.electronAPI?.getKeyStoreSync({
            key: "closeAction",
          }) || "miniSize",
      });
      const cache =
        window.electronAPI?.getKeyStoreSync({
          key: "media_cache_record",
        }) || {};
      initImageCache(cache);
      window.electronAPI?.mainWinReady();
    };

    initSettingStore();
    checkNotificationPermission();
  }, []);

  return (
    <>
      <Outlet />
      <AutoUpdateModal />
    </>
  );
};
