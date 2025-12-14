import { SessionType } from "@openim/wasm-client-sdk";
import clsx from "clsx";
import { FC, memo } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidV4 } from "uuid";

import { message as AntdMessage } from "@/AntdGlobalComp";
import rtc_audio_call from "@/assets/images/messageItem/rtc_audio_call.png";
import rtc_audio_call_rs from "@/assets/images/messageItem/rtc_audio_call_rs.png";
import rtc_video_call from "@/assets/images/messageItem/rtc_video_call.png";
import rtc_video_call_rs from "@/assets/images/messageItem/rtc_video_call_rs.png";
import { MessageRenderContext, RtcMessageStatus } from "@/constants";
import { useConversationStore, useUserStore } from "@/store";
import { emit } from "@/utils/events";
import { isRtcOrMeetingBusy } from "@/utils/rtc";

import { IMessageItemProps } from ".";
import styles from "./message-item.module.scss";

const RtcMessageRender: FC<IMessageItemProps> = ({
  message,
  isSender,
  renderContext,
}) => {
  const { t } = useTranslation();

  const messageData = JSON.parse(message.customElem!.data).data;

  const reCall = () => {
    if (isRtcOrMeetingBusy()) {
      return;
    }
    const conversation = useConversationStore.getState().currentConversation;
    emit("OPEN_RTC_MODAL", {
      invitation: {
        inviterUserID: useUserStore.getState().selfInfo.userID,
        inviteeUserIDList: [conversation!.userID],
        groupID: "",
        roomID: uuidV4(),
        timeout: 60,
        mediaType: messageData.mediaType,
        sessionType: SessionType.Single,
        platformID: window.electronAPI?.getPlatform() ?? 5,
      },
      participant: {
        userInfo: {
          nickname: conversation!.showName,
          userID: conversation!.userID,
          faceURL: conversation!.faceURL,
          ex: "",
        },
      },
    });
  };

  const getStatusStr = () => {
    switch (messageData.status) {
      case RtcMessageStatus.Canceled:
        return t("canceled");
      case RtcMessageStatus.Refused:
        return t("application.refused");
      case RtcMessageStatus.Timeout:
        return t("placeholder.callTimeout");
      case RtcMessageStatus.Successed:
        return t("placeholder.callTime");
      case RtcMessageStatus.Interrupt:
        return t("placeholder.callInterrupt");
      case RtcMessageStatus.HandleByOtherDevice:
        return t("placeholder.handleByOtherDevice");
      case RtcMessageStatus.UnknownDisconnect:
        return t("placeholder.callAbnormal");
      default:
        return "";
    }
  };

  const getIcon = () => {
    if (isSender) {
      return messageData.mediaType === "video" ? rtc_video_call : rtc_audio_call;
    }
    return messageData.mediaType === "video" ? rtc_video_call_rs : rtc_audio_call_rs;
  };

  return (
    <div
      className={clsx(
        styles.bubble,
        "flex cursor-pointer items-center !py-2",
        !isSender && "flex-row-reverse",
        renderContext !== MessageRenderContext.Chat && "justify-end",
      )}
      onClick={renderContext === MessageRenderContext.Chat ? reCall : undefined}
    >
      <img width={18} src={getIcon()} alt="" />
      <div className={clsx("ml-1.5 flex", { "ml-0 mr-1.5": !isSender })}>
        <div className="mr-1.5">{getStatusStr()}</div>
        {(messageData.status === RtcMessageStatus.Successed ||
          messageData.status === RtcMessageStatus.Interrupt) && (
          <div>{messageData.duration || ""}</div>
        )}
      </div>
    </div>
  );
};

export default memo(RtcMessageRender);
