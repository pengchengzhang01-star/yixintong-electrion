import { MessageStatus } from "@openim/wasm-client-sdk";
import { WsResponse } from "@openim/wasm-client-sdk/lib/types/entity";
import { SendMsgParams } from "@openim/wasm-client-sdk/lib/types/params";
import { useCallback } from "react";

import { IMSDK } from "@/layout/MainContentWrap";
import { ExMessageItem, useConversationStore, useMessageStore } from "@/store";
import { emit } from "@/utils/events";

import {
  deleteAndPushOneMessage,
  pushNewMessage,
  updateOneMessage,
} from "../useHistoryMessageList";

export type SendMessageParams = Partial<Omit<SendMsgParams, "message">> & {
  message: ExMessageItem;
  needPush?: boolean;
  isResend?: boolean;
};

export function useSendMessage() {
  const tryAddPreviewImg = useMessageStore((state) => state.tryAddPreviewImg);

  const sendMessage = useCallback(
    async ({ recvID, groupID, message, needPush, isResend }: SendMessageParams) => {
      const currentConversation = useConversationStore.getState().currentConversation;
      const sourceID = recvID || groupID;
      const inCurrentConversation =
        currentConversation?.userID === sourceID ||
        currentConversation?.groupID === sourceID ||
        !sourceID;
      needPush = needPush ?? inCurrentConversation;

      if (needPush) {
        pushNewMessage(message);
      }

      const options = {
        recvID: recvID ?? currentConversation?.userID ?? "",
        groupID: groupID ?? currentConversation?.groupID ?? "",
        message,
      };

      try {
        const { data: successMessage } = await IMSDK.sendMessage(options);
        if (isResend) {
          deleteAndPushOneMessage(successMessage as ExMessageItem);
          return;
        }
        updateOneMessage(successMessage as ExMessageItem);
        tryAddPreviewImg([successMessage as ExMessageItem]);
      } catch (error) {
        updateOneMessage({
          ...message,
          status: MessageStatus.Failed,
          errCode: (error as WsResponse).errCode,
        } as ExMessageItem);
        IMSDK.setMessageLocalEx({
          conversationID: currentConversation?.conversationID ?? "",
          clientMsgID: message.clientMsgID,
          localEx: String((error as WsResponse).errCode),
        });
      }
    },
    [],
  );

  return {
    sendMessage,
  };
}
