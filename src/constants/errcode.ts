import { t } from "i18next";

export const ErrCodeMap: Record<number, string> = {
  1003: t("errCode.duplicateKey"),
  20001: t("errCode.passwordError"),
  20002: t("errCode.accountNotExist"),
  20003: t("errCode.phoneNumberRegistered"),
  20004: t("errCode.accountRegistered"),
  20005: t("errCode.operationTooFrequent"),
  20006: t("errCode.verificationCodeError"),
  20007: t("errCode.verificationCodeExpired"),
  20008: t("errCode.verificationCodeErrorLimitExceed"),
  20009: t("errCode.verificationCodeUsed"),
  20010: t("errCode.invitationCodeUsed"),
  20011: t("errCode.invitationCodeNotExist"),
  20012: t("errCode.operationRestriction"),
  20014: t("errCode.accountRegistered"),
  200005: t("errCode.meetingCantEditAfterStart"),
};

export enum IMSDKErrCode {
  Blacked = 1302,
  NotFriend = 1303,
  NotAllowAddFriend = 1310,
}

export const JoinMeetingErrCodeMap: Record<number, string> = {
  1004: t("toast.meetingOverOrNotFound"),
  200001: t("toast.joinedOtherMeetingOrRtc"),
  200002: t("errCode.passwordError"),
  200004: t("toast.meetingOver"),
};
