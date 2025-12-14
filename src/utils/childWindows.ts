import { ChildWindowOptions } from "@/types/common";
import { getChatToken, getIMToken } from "./storage";
import { RouteTravel } from "@/pages/common/MomentsModal";
import { RtcInviteResults } from "@openim/wasm-client-sdk/lib/types/entity";
import { t } from "i18next";
import { emitToSpecifiedWindow } from "./events";
import { useUserStore } from "@/store";

export const openPersonalSettings = async () => {
  const precheck = JSON.stringify({
    token: await getChatToken(),
  });
  const options: ChildWindowOptions = {
    title: t("placeholder.personalSetting"),
    width: 600,
    height: 668,
    minWidth: 600,
    minHeight: 668,
    frame: false,
  };
  window.electronAPI?.openChildWindow({
    arg: "third/personal-settings",
    key: "personal-settings",
    search: `precheck=${precheck}`,
    options,
  });
};

export const openGlobalSearch = async () => {
  const precheck = JSON.stringify({
    token: await getChatToken(),
    isOrganizationMember: !!useUserStore.getState().organizationInfo.name,
  });
  const options: ChildWindowOptions = {
    title: t("placeholder.search"),
    width: 600,
    height: 668,
    minWidth: 600,
    minHeight: 668,
    frame: false,
  };
  window.electronAPI?.openChildWindow({
    arg: "third/global-search",
    key: "global-search",
    search: `precheck=${precheck}`,
    options,
  });
};

export const openMoments = async (user: RouteTravel) => {
  const precheck = JSON.stringify({
    token: await getChatToken(),
    user,
  });
  const options: ChildWindowOptions = {
    title: t("placeholder.moments"),
    width: 550,
    height: 668,
    minWidth: 550,
    minHeight: 668,
    resizable: false,
    frame: false,
  };
  window.electronAPI?.openChildWindow({
    arg: "third/moments",
    key: "moments",
    search: `precheck=${precheck}`,
    options,
  });
};

export const openAbout = async () => {
  const precheck = JSON.stringify({
    imToken: await getIMToken(),
  });
  const options: ChildWindowOptions = {
    title: t("placeholder.about"),
    width: 360,
    height: 410,
    resizable: false,
    frame: false,
  };
  window.electronAPI?.openChildWindow({
    arg: "third/about",
    key: "about",
    search: `precheck=${precheck}`,
    options,
  });
};

export const openChooseContact = (precheck?: string) => {
  const options: ChildWindowOptions = {
    title: t("placeholder.selectUser"),
    width: 680,
    height: 680,
    resizable: false,
    frame: false,
  };
  window.electronAPI?.openChildWindow({
    arg: `third/choose-contact`,
    key: "choose-contact",
    search: precheck ? `precheck=${precheck}` : undefined,
    options,
  });
};

export const openRtcCall = async (isGroup: boolean, precheck: string) => {
  const windowWidth = isGroup ? 500 : 480;
  const windowHeight = isGroup ? 372 : 340;
  const options: ChildWindowOptions = {
    title: t("placeholder.call"),
    width: windowWidth,
    height: windowHeight,
    minWidth: windowWidth,
    minHeight: windowHeight,
    frame: false,
  };
  if (precheck) {
    precheck = JSON.stringify({
      ...JSON.parse(precheck),
      chatToken: await getChatToken(),
    });
  }
  window.electronAPI?.openChildWindow({
    arg: `third/rtc-call`,
    key: "rtc-call",
    search: precheck ? `precheck=${precheck}` : undefined,
    options,
  });
};

export const openMeetingManage = async () => {
  const precheck = JSON.stringify({
    imToken: await getIMToken(),
    chatToken: await getChatToken(),
  });
  const options: ChildWindowOptions = {
    title: t("placeholder.meeting"),
    width: 420,
    height: 550,
    resizable: false,
    frame: false,
  };
  window.electronAPI?.openChildWindow({
    arg: "third/meeting-manage",
    key: "meeting-manage",
    search: `precheck=${precheck}`,
    options,
  });
};

export const openMeeting = async (authData: RtcInviteResults) => {
  const precheck = JSON.stringify({
    imToken: await getIMToken(),
    chatToken: await getChatToken(),
    authData,
  });
  const options: ChildWindowOptions = {
    title: t("placeholder.meeting"),
    width: 960,
    height: 650,
    minWidth: 960,
    minHeight: 650,
    frame: false,
  };
  window.electronAPI?.openChildWindow({
    arg: "third/meeting",
    key: "meeting",
    search: `precheck=${precheck}`,
    options,
  });
};

export const checkIsMeeting = () => {
  const hasMeetingWindow = window.electronAPI?.checkChildWindowStatusSync({
    key: "meeting",
  });
  if (hasMeetingWindow) {
    emitToSpecifiedWindow("REPEAT_OPEN_MEETING", undefined, "meeting");
    openMeeting(null as any);
  }
  return hasMeetingWindow;
};
