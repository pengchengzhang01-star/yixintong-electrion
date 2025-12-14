import "./index.scss";

import { useEffect } from "react";

import { RtcCallContent } from "@/pages/common/RtcCallModal";
import { useUserStore } from "@/store";
import { setChatToken } from "@/utils/storage";

export const RtcCall = () => {
  const str = window.location.href.split("precheck=")[1];
  const precheck = JSON.parse(decodeURIComponent(str));

  const getSelfInfoByReq = useUserStore((state) => state.getSelfInfoByReq);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await setChatToken(precheck.chatToken as string);
    getSelfInfoByReq();
  };

  const closeWindow = () => {
    window.electronAPI?.closeWindow("rtc-call");
  };
  return (
    <div className="single-rtc-window app-drag">
      <RtcCallContent
        inviteData={precheck.inviteData}
        isRecv={precheck.isRecv}
        selfID={precheck.selfID}
        isSingleWindow
        isOverlayOpen
        closeOverlay={closeWindow}
      />
    </div>
  );
};
