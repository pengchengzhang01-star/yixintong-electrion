import { MessageStatus } from "@openim/wasm-client-sdk";
import { MessageItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { Spin } from "antd";
import { t } from "i18next";
import { useEffect, useState } from "react";

import cancel from "@/assets/images/chatFooter/cancel.png";
import forward from "@/assets/images/chatFooter/forward.png";
import remove from "@/assets/images/chatFooter/remove.png";
import { useCheckConfirmModal } from "@/hooks/useCheckConfirmModal";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useMessageStore, useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import { emit } from "@/utils/events";
import { formatMessageByType, isGroupSession } from "@/utils/imCommon";

import { deleteOneMessage, getMessageList } from "../useHistoryMessageList";

const multipleActionList = [
  {
    title: t("placeholder.mergeForward"),
    icon: forward,
  },
  {
    title: t("placeholder.delete"),
    icon: remove,
  },
  {
    title: t("placeholder.close"),
    icon: cancel,
  },
];

const MultipleActionBar = () => {
  const [loading, setLoading] = useState(false);
  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const updateCheckMode = useMessageStore((state) => state.updateCheckMode);

  const { showCheckConfirmModal } = useCheckConfirmModal();

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        updateCheckMode(false);
      }
    };
    document.addEventListener("keydown", keyDownHandler);
    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, []);

  const actionClick = async (idx: number) => {
    switch (idx) {
      case 0:
        emit("OPEN_CHOOSE_MODAL", {
          type: "FORWARD_MESSAGE",
          extraData: await getMergeMessageOptions(),
        });
        break;
      case 1: {
        const messageList = await getCheckedMessageList();
        const allSelfMessages = messageList.every(
          (message) => message.sendID === useUserStore.getState().selfInfo.userID,
        );
        showCheckConfirmModal({
          title: t("toast.deleteMessage"),
          confirmTip: t(allSelfMessages ? "toast.mutualDelete" : "toast.deleteConfirm"),
          description: allSelfMessages ? t("toast.deleteDescription") : undefined,
          showCheckbox: allSelfMessages,
          onOk: (mutual) => batchDeleteMessage(mutual, messageList),
        });
        break;
      }
      default:
        break;
    }
    updateCheckMode(false);
  };

  const batchDeleteMessage = async (mutual: boolean, messageList: MessageItem[]) => {
    setLoading(true);
    try {
      const successMessageIDs = messageList
        .filter((message) => message.status === MessageStatus.Succeed)
        .map((message) => message.clientMsgID);
      const failedMessageIDs = messageList
        .filter((message) => message.status === MessageStatus.Failed)
        .map((message) => message.clientMsgID);
      if (successMessageIDs.length) {
        await IMSDK.deleteMessages({
          clientMsgIDs: messageList.map((message) => message.clientMsgID),
          conversationID: currentConversation!.conversationID,
          isSync: mutual,
        });
      }
      await Promise.all(
        failedMessageIDs.map((clientMsgID) =>
          IMSDK.deleteMessageFromLocalStorage({
            conversationID: currentConversation!.conversationID,
            clientMsgID,
          }),
        ),
      );
      messageList.forEach((message) => deleteOneMessage(message.clientMsgID));
    } catch (error) {
      feedbackToast({ error: t("toast.messagesDeleteFailed") });
    }
    setLoading(false);
  };

  const getMergeMessageOptions = async () => {
    const messageList = await getCheckedMessageList();
    const summaryList = messageList
      .slice(0, 4)
      .map(
        (message) =>
          `${message.senderNickname}：${formatMessageByType(message as MessageItem)}`,
      );
    return {
      messageList,
      summaryList,
      title: t("placeholder.whosMessageHistory", {
        who: isGroupSession(currentConversation?.conversationType)
          ? t("placeholder.group")
          : t("placeholder.and", {
              someone: useUserStore.getState().selfInfo.nickname,
              otherone: currentConversation?.showName,
            }),
      }),
    };
  };

  const getCheckedMessageList = async () =>
    (await getMessageList()).filter((message) => message.checked);

  return (
    <Spin spinning={loading}>
      <div className="flex border-t bg-[var(--chat-bubble)] px-16 py-4">
        {multipleActionList.map((action, idx) => (
          <div
            className="mr-8 flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-md bg-white last:mr-0"
            key={action.title}
            onClick={() => actionClick(idx)}
          >
            <img width={24} src={action.icon} className="mb-1.5 mt-2" alt="" />
            <span className="text-xs text-[var(--sub-text)]">{action.title}</span>
          </div>
        ))}
      </div>
    </Spin>
  );
};

export default MultipleActionBar;
