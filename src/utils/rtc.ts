import { t } from "i18next";

import { message } from "@/AntdGlobalComp";

export const isRtcOrMeetingBusy = () => {
  const inRtc = window.electronAPI?.checkChildWindowStatusSync({
    key: "rtc-call",
  });
  if (inRtc) {
    message.warning(t("toast.repeatOpenRtc"));
    return true;
  }
  const inMeeting = window.electronAPI?.checkChildWindowStatusSync({
    key: "meeting",
  });
  if (inMeeting) {
    message.warning(t("toast.inMeetingCannotRtcCall"));
    return true;
  }
  return false;
};
