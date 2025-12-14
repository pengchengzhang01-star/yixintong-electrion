import { t } from "i18next";

import { message } from "@/AntdGlobalComp";
import { ErrCodeMap, JoinMeetingErrCodeMap } from "@/constants";

interface ErrorData {
  errCode: number;
  errMsg?: string;
}

export const errorHandle = (err: unknown) => {
  const errData = err as ErrorData;
  if (errData.errMsg) {
    message.error(ErrCodeMap[errData.errCode] || errData.errMsg);
  }
};

export const joinMeetingErrorHandle = (err: unknown) => {
  const errData = err as ErrorData;
  if (errData.errMsg) {
    message.error(
      JoinMeetingErrCodeMap[errData.errCode] || t("toast.joinMeetingFailed"),
    );
  }
};
