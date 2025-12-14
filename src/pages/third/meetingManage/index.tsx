import { useEffect } from "react";

import { MeetingManageContent } from "@/pages/common/MeetingManageModal";
import { useUserStore } from "@/store";
import { setChatToken, setTMToken } from "@/utils/storage";

export const MeetingManage = () => {
  const str = window.location.href.split("precheck=")[1];
  const precheck = JSON.parse(decodeURIComponent(str));

  const { getSelfInfoByReq } = useUserStore.getState();

  const closeWindow = () => {
    window.electronAPI?.closeWindow("meeting-manage");
  };

  const init = async () => {
    if (precheck.imToken && precheck.chatToken) {
      await setTMToken(precheck.imToken as string);
      await setChatToken(precheck.chatToken as string);
      getSelfInfoByReq();
    }
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div>
      <MeetingManageContent closeOverlay={closeWindow} />
    </div>
  );
};
