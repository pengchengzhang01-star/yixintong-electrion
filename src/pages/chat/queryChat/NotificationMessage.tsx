import { useInViewport } from "ahooks";
import clsx from "clsx";
import { t } from "i18next";
import { FC, memo, useEffect, useRef } from "react";

import { ExMessageItem, useConversationStore, useUserStore } from "@/store";
import { emit } from "@/utils/events";
import { formatMessageTime, notificationMessageFormat } from "@/utils/imCommon";

import { updateOneMessage } from "./useHistoryMessageList";

const NotificationMessage: FC<{
  message: ExMessageItem;
}> = ({ message }) => {
  const messageWrapRef = useRef<HTMLDivElement>(null);
  const revokeMap = useConversationStore((state) => state.revokeMap);
  const showEdit = Boolean(revokeMap[message.clientMsgID]);

  // locale re render
  useUserStore((state) => state.appSettings.locale);

  const [inViewport] = useInViewport(messageWrapRef, {
    root: document.getElementById("chat-main"),
  });

  useEffect(() => {
    if (inViewport && message.isAppend) {
      updateOneMessage({
        clientMsgID: message.clientMsgID,
        isAppend: false,
      } as ExMessageItem);
      emit("UPDATE_IS_HAS_NEW_MESSAGES", false);
    }
  }, [inViewport, message.isAppend]);

  const perfix = showEdit
    ? `<span class='link-el ml-0.5' onclick='editRevoke("${message.clientMsgID}")'>${t(
        "placeholder.reEdit",
      )}</span>`
    : "";

  return (
    <div className="relative" id={`chat_${message.clientMsgID}`}>
      <div
        ref={messageWrapRef}
        className={clsx(
          "mx-6 py-3 text-center text-xs text-[var(--sub-text)]",
          message.gapTime && "!pt-9",
        )}
        dangerouslySetInnerHTML={{
          __html: `${notificationMessageFormat(message)}${perfix}`,
        }}
      ></div>
      {message.gapTime && (
        <div className="absolute left-1/2 top-1 -translate-x-1/2 text-xs text-[var(--sub-text)]">
          {formatMessageTime(message.sendTime, true)}
        </div>
      )}
    </div>
  );
};

export default memo(NotificationMessage);
