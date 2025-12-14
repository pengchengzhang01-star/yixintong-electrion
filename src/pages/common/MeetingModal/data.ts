import { t } from "i18next";

export type MeetingConfig = {
  token: string;
  roomID: string;
  liveURL: string;
};

export type MeetingInvitation = {
  inviterFaceURL: string;
  id: string;
  duration: number;
  inviterNickname: string;
  inviterUserID: string;
  subject: string;
  start: number;
};

export const secondsToTime = {
  1800: t("date.minute", { num: 30 }),
  3600: t("date.hour", { num: 1 }),
  5400: t("date.hour", { num: 1.5 }),
  7200: t("date.hour", { num: 2 }),
};
