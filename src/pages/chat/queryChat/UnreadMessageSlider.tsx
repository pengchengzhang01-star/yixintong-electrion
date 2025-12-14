import clsx from "clsx";
import { t } from "i18next";
import { forwardRef, ForwardRefRenderFunction, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import db_arrow_down from "@/assets/images/common/db_arrow_down.png";
import { useMessageStore } from "@/store";
import emitter from "@/utils/events";

import { clearMessageState, loadHistoryMessages } from "./useHistoryMessageList";

const UnreadMessageSlider: ForwardRefRenderFunction<
  unknown,
  { scrollToBottom: () => void }
> = ({ scrollToBottom }) => {
  const { conversationID } = useParams();
  const [showSlider, setShowSlider] = useState(false);
  const jumpClientMsgID = useMessageStore((state) => state.jumpClientMsgID);
  const updateJumpClientMsgID = useMessageStore((state) => state.updateJumpClientMsgID);

  useEffect(() => {
    const updateIsHasNewMessages = (hasNewMessage: boolean) => {
      setShowSlider(hasNewMessage);
    };
    emitter.on("UPDATE_IS_HAS_NEW_MESSAGES", updateIsHasNewMessages);
    return () => {
      emitter.off("UPDATE_IS_HAS_NEW_MESSAGES", updateIsHasNewMessages);
      setShowSlider(false);
    };
  }, [conversationID]);

  const clearReadCount = () => {
    clearMessageState("isAppend");
    setShowSlider(false);
  };

  const clearRead = () => {
    if (jumpClientMsgID) {
      loadHistoryMessages();
    }

    scrollToBottom();
    clearReadCount();
    updateJumpClientMsgID();
  };

  return (
    <div
      style={{
        boxShadow: "0px 6px 16px 1px rgba(142,154,176,0.16)",
        transition: "opacity 0.3s ease",
        opacity: showSlider ? 1 : 0,
      }}
      className={clsx(
        "shadow-[0px 6px 16px 1px rgba(142,154,176,0.16)] boder-[var(--gap-text)] absolute bottom-3 left-1/2 flex -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border bg-white py-1 pl-2 pr-3",
        {
          "pointer-events-none": !showSlider,
        },
      )}
      onClick={clearRead}
    >
      <img width={17} src={db_arrow_down} alt="" />
      <div className="text-xs text-[var(--primary)]">
        {t("placeholder.newMessages")}
      </div>
    </div>
  );
};

export default forwardRef(UnreadMessageSlider);
