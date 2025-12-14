import { CbEvents } from "@openim/wasm-client-sdk";
import { SessionType } from "@openim/wasm-client-sdk";
import {
  GroupMessageReceiptInfo,
  ReceiptInfo,
  WSEvent,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { useEffect } from "react";

import { IMSDK } from "@/layout/MainContentWrap";
import { ExMessageItem, useConversationStore, useUserStore } from "@/store";

import { getMessageList, updateOneMessage } from "./useHistoryMessageList";

export function useMessageReceipt() {
  const selfUserID = useUserStore((state) => state.selfInfo.userID);

  useEffect(() => {
    setIMListener();
    return () => {
      disposeIMListener();
    };
  }, [selfUserID]);

  const setIMListener = () => {
    IMSDK.on(CbEvents.OnRecvC2CReadReceipt, singleMessageHasReadedHander);
    IMSDK.on(CbEvents.OnRecvGroupReadReceipt, groupMessageHasReadedHander);
  };

  const disposeIMListener = () => {
    IMSDK.off(CbEvents.OnRecvC2CReadReceipt, singleMessageHasReadedHander);
    IMSDK.off(CbEvents.OnRecvGroupReadReceipt, groupMessageHasReadedHander);
  };

  const singleMessageHasReadedHander = ({ data }: WSEvent<ReceiptInfo[]>) => {
    if (
      useConversationStore.getState().currentConversation?.conversationType !==
      SessionType.Single
    )
      return;

    data.map((receipt) => {
      (receipt.msgIDList ?? []).map((clientMsgID: string) => {
        updateOneMessage({
          clientMsgID,
          isRead: true,
        } as ExMessageItem);
      });
    });
  };

  const groupMessageHasReadedHander = async ({
    data,
  }: WSEvent<GroupMessageReceiptInfo>) => {
    if (
      useConversationStore.getState().currentConversation?.conversationID !==
      data.conversationID
    )
      return;
    const historyMessageList = await getMessageList();
    data.groupMessageReadInfo.map((receipt) => {
      const hasSelfRead = receipt.readMembers?.some(
        (member) => member.userID === selfUserID,
      );
      const oldMessage = historyMessageList.find(
        (message) => message.clientMsgID === receipt.clientMsgID,
      );
      updateOneMessage({
        ...oldMessage,
        isRead: hasSelfRead ? true : oldMessage?.isRead,
        attachedInfoElem: {
          ...oldMessage?.attachedInfoElem,
          groupHasReadInfo: {
            hasReadCount: receipt.hasReadCount,
            unreadCount: receipt.unreadCount,
          },
        },
      } as ExMessageItem);
    });
  };
}
