import { CbEvents } from "@openim/wasm-client-sdk";
import { BlackUserItem, WSEvent } from "@openim/wasm-client-sdk/lib/types/entity";
import { useEffect } from "react";

import { PersonalSettingsContent } from "@/layout/LeftNavBar/PersonalSettings";
import { IMSDK } from "@/layout/MainContentWrap";
import { useContactStore, useUserStore } from "@/store";
import { setChatToken } from "@/utils/storage";

export const PersonalSettings = () => {
  const str = window.location.href.split("precheck=")[1];
  const precheck = JSON.parse(decodeURIComponent(str));

  const closeWindow = () => {
    window.electronAPI?.closeWindow("personal-settings");
  };

  const getSelfInfoByReq = useUserStore((state) => state.getSelfInfoByReq);
  const updateAppSettings = useUserStore((state) => state.updateAppSettings);
  const getBlackListByReq = useContactStore((state) => state.getBlackListByReq);
  const pushNewBlack = useContactStore((state) => state.pushNewBlack);
  const updateBlack = useContactStore((state) => state.updateBlack);

  const blackAddedHandler = ({ data }: WSEvent<BlackUserItem>) => {
    pushNewBlack(data);
  };
  const blackDeletedHandler = ({ data }: WSEvent<BlackUserItem>) => {
    updateBlack(data, true);
  };

  const initStoreage = async () => {
    if (precheck.token) {
      updateAppSettings({
        closeAction:
          (await window.electronAPI?.getKeyStore({
            key: "closeAction",
          })) || "miniSize",
      });
      await setChatToken(precheck.token as string);
      getSelfInfoByReq();
      getBlackListByReq();
    }
  };

  useEffect(() => {
    initStoreage();
    IMSDK.on(CbEvents.OnBlackAdded, blackAddedHandler);
    IMSDK.on(CbEvents.OnBlackDeleted, blackDeletedHandler);

    return () => {
      IMSDK.off(CbEvents.OnBlackAdded, blackAddedHandler);
      IMSDK.off(CbEvents.OnBlackDeleted, blackDeletedHandler);
    };
  }, []);

  return (
    <div className="h-full bg-[var(--chat-bubble)]">
      <PersonalSettingsContent closeOverlay={closeWindow} />
    </div>
  );
};
