import { MessageType, SessionType, ViewType } from "@openim/wasm-client-sdk";
import { useLatest, useRequest } from "ahooks";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { IMSDK } from "@/layout/MainContentWrap";
import { ExMessageItem, useConversationStore, useMessageStore } from "@/store";
import emitter, {
  emit,
  GetMessageContextParams,
  UpdateMessaggeBaseInfoParams,
} from "@/utils/events";

const START_INDEX = 10000;
const SPLIT_COUNT = 20;

let currentMessageReqId = 0;

export function useHistoryMessageList({
  scrollToIndex,
}: {
  scrollToIndex: (index: number) => void;
}) {
  const { conversationID } = useParams();
  const pushState = useRef(false);
  const pushStateTimer = useRef<NodeJS.Timeout>();
  const [loadState, setLoadState] = useState({
    initLoading: true,
    hasMoreOld: true,
    hasMoreNew: true,
    messageList: [] as ExMessageItem[],
    firstItemIndex: START_INDEX,
  });
  const pendingClientMsgIDs = useRef([] as string[]);
  const latestLoadState = useLatest(loadState);
  const getConversationPreviewImgList = useMessageStore(
    (state) => state.getConversationPreviewImgList,
  );
  const updateCheckMode = useMessageStore((state) => state.updateCheckMode);
  const clearPreviewList = useMessageStore((state) => state.clearPreviewList);
  const updateQuoteMessage = useConversationStore((state) => state.updateQuoteMessage);

  const updatePushState = () => {
    if (pushStateTimer.current) {
      clearTimeout(pushStateTimer.current);
    }
    pushState.current = true;
    pushStateTimer.current = setTimeout(() => {
      pushState.current = false;
    }, 500);
  };

  useEffect(() => {
    if (!useMessageStore.getState().jumpClientMsgID) {
      loadHistoryMessages();
    }
    return () => {
      updateCheckMode(false);
      updateQuoteMessage();
      clearPreviewList();
      setLoadState(() => ({
        initLoading: true,
        hasMoreOld: true,
        hasMoreNew: true,
        messageList: [] as ExMessageItem[],
        firstItemIndex: START_INDEX,
      }));
    };
  }, [conversationID]);

  useEffect(() => {
    const pushNewMessage = (message: ExMessageItem) => {
      const isSearchMode = Boolean(useMessageStore.getState().jumpClientMsgID);
      const isRepeated = latestLoadState.current.messageList.some(
        (item) => item.clientMsgID === message.clientMsgID,
      );
      if ((isSearchMode && latestLoadState.current.hasMoreNew) || isRepeated) {
        if (message.isAppend) {
          pendingClientMsgIDs.current.push(message.clientMsgID);
        }
        return;
      }
      updatePushState();
      setLoadState((preState) => {
        message.gapTime =
          message.sendTime -
            (preState.messageList[preState.messageList.length - 1]?.sendTime ?? 0) >
          300000;
        return {
          ...preState,
          messageList: removeRepeatedMessages([...preState.messageList, message]),
        };
      });
    };
    const updateOneMessage = (message: ExMessageItem) => {
      setLoadState((preState) => {
        const tmpList = [...preState.messageList];
        const idx = tmpList.findIndex((msg) => msg.clientMsgID === message.clientMsgID);
        if (idx < 0) {
          return preState;
        }

        tmpList[idx] = { ...tmpList[idx], ...message };
        if (message.contentType === MessageType.RevokeMessage) {
          updateQuotedMessages(tmpList, message.clientMsgID);
        }
        return {
          ...preState,
          messageList: tmpList,
        };
      });
    };
    const updateMessageNicknameAndFaceUrl = ({
      sendID,
      senderNickname,
      senderFaceUrl,
    }: UpdateMessaggeBaseInfoParams) => {
      setLoadState((preState) => {
        const tmpList = [...preState.messageList].map((message) => {
          if (message.sendID === sendID) {
            message.senderFaceUrl = senderFaceUrl;
            message.senderNickname = senderNickname;
          }
          return message;
        });
        return {
          ...preState,
          messageList: tmpList,
        };
      });
    };
    const deleteOnewMessage = (clientMsgID: string) => {
      setLoadState((preState) => {
        const tmpList = [...preState.messageList];
        const idx = tmpList.findIndex((msg) => msg.clientMsgID === clientMsgID);
        if (idx < 0) {
          return preState;
        }
        tmpList.splice(idx, 1);

        return {
          ...preState,
          messageList: tmpList,
        };
      });
    };
    const deleteMessagesByUser = (userID: string) => {
      setLoadState((preState) => {
        const tmpList = [...preState.messageList].filter(
          (message) => message.sendID !== userID,
        );
        return {
          ...preState,
          messageList: tmpList,
        };
      });
    };
    const deleteOnewMessageAndPush = (message: ExMessageItem) => {
      setLoadState((preState) => {
        const tmpList = [...preState.messageList];
        const idx = tmpList.findIndex((msg) => msg.clientMsgID === message.clientMsgID);
        if (idx < 0) {
          return preState;
        }
        tmpList.splice(idx, 1);
        return {
          ...preState,
          messageList: [...tmpList, message],
        };
      });
    };
    const clearMessages = () => {
      setLoadState(() => ({
        initLoading: false,
        hasMoreOld: true,
        hasMoreNew: true,
        messageList: [] as ExMessageItem[],
        firstItemIndex: START_INDEX,
      }));
    };
    const clearMessageState = (key: keyof ExMessageItem) => {
      setLoadState((preState) => ({
        ...preState,
        messageList: preState.messageList.map((message) => ({
          ...message,
          [key]: false,
        })),
      }));
    };
    const getMessageContextHandler = ({ message, viewType }: GetMessageContextParams) =>
      getMessageContext(message, viewType);
    const getMessageList = (callback: (messages: ExMessageItem[]) => void) =>
      setTimeout(() => {
        callback(latestLoadState.current.messageList);
      });

    const refresh = () => {
      loadHistoryMessages();
    };
    emitter.on("PUSH_NEW_MSG", pushNewMessage);
    emitter.on("UPDATE_ONE_MSG", updateOneMessage);
    emitter.on("UPDATE_MSG_NICK_AND_FACEURL", updateMessageNicknameAndFaceUrl);
    emitter.on("DELETE_ONE_MSG", deleteOnewMessage);
    emitter.on("DELETE_MSG_BY_USER", deleteMessagesByUser);
    emitter.on("DELETE_AND_PUSH_ONE_MSG", deleteOnewMessageAndPush);
    emitter.on("CLEAR_MSGS", clearMessages);
    emitter.on("CLEAR_MSG_STATE", clearMessageState);
    emitter.on("LOAD_HISTORY_MSGS", loadHistoryMessages);
    emitter.on("GET_MSG_CONTEXT", getMessageContextHandler);
    emitter.on("GET_MSG_LIST", getMessageList);
    emitter.on("SYNC_NEW_MSGS", refresh);
    return () => {
      emitter.off("PUSH_NEW_MSG", pushNewMessage);
      emitter.off("UPDATE_ONE_MSG", updateOneMessage);
      emitter.off("UPDATE_MSG_NICK_AND_FACEURL", updateMessageNicknameAndFaceUrl);
      emitter.off("DELETE_ONE_MSG", deleteOnewMessage);
      emitter.off("DELETE_MSG_BY_USER", deleteMessagesByUser);
      emitter.off("DELETE_AND_PUSH_ONE_MSG", deleteOnewMessageAndPush);
      emitter.off("CLEAR_MSGS", clearMessages);
      emitter.off("CLEAR_MSG_STATE", clearMessageState);
      emitter.off("LOAD_HISTORY_MSGS", loadHistoryMessages);
      emitter.off("GET_MSG_CONTEXT", getMessageContextHandler);
      emitter.off("GET_MSG_LIST", getMessageList);
      emitter.off("SYNC_NEW_MSGS", refresh);
    };
  }, []);

  const loadHistoryMessages = () =>
    getMoreOldMessages(false).then(() => getConversationPreviewImgList());

  const { loading: moreOldLoading, runAsync: getMoreOldMessages } = useRequest(
    async (loadMore = true) => {
      const requestId = ++currentMessageReqId;
      const { data } = await IMSDK.getAdvancedHistoryMessageList({
        count: SPLIT_COUNT,
        startClientMsgID: loadMore
          ? latestLoadState.current.messageList[0]?.clientMsgID
          : "",
        conversationID: conversationID ?? "",
        viewType: useMessageStore.getState().jumpClientMsgID
          ? ViewType.Search
          : ViewType.History,
      });

      if (requestId !== currentMessageReqId) {
        console.warn(
          "getAdvancedHistoryMessageList: requestId mismatch, ignore this response",
        );
        return;
      }
      console.warn(data.messageList);
      (data.messageList as ExMessageItem[]).map((message, idx) => {
        if (!idx) {
          message.gapTime = true;
          return;
        }
        const prevTime = data.messageList[idx - 1]?.sendTime ?? 0;
        if (message.sessionType === SessionType.Notification) {
          (data.messageList[idx - 1] as ExMessageItem).gapTime =
            message.sendTime - prevTime > 300000;
        } else {
          message.gapTime = message.sendTime - prevTime > 300000;
        }
      });
      setTimeout(() =>
        setLoadState((preState) => ({
          ...preState,
          initLoading: false,
          hasMoreOld: !data.isEnd,
          messageList: removeRepeatedMessages([
            ...data.messageList,
            ...(loadMore ? preState.messageList : []),
          ]),
          firstItemIndex: preState.firstItemIndex - data.messageList.length,
        })),
      );
    },
    {
      manual: true,
    },
  );

  const { loading: moreNewLoading, runAsync: getMoreNewMessages } = useRequest(
    async () => {
      const lastMessage = latestLoadState.current.messageList.findLast((message) =>
        Boolean(message.seq),
      );
      const { data } = await IMSDK.getAdvancedHistoryMessageListReverse({
        count: SPLIT_COUNT,
        startClientMsgID: lastMessage?.clientMsgID ?? "",
        conversationID: conversationID ?? "",
        viewType: useMessageStore.getState().jumpClientMsgID
          ? ViewType.Search
          : ViewType.History,
      });
      (data.messageList as ExMessageItem[]).map((message, idx) => {
        if (pendingClientMsgIDs.current.includes(message.clientMsgID)) {
          message.isAppend = true;
        }
        if (!idx) {
          message.gapTime = true;
          return;
        }
        const prevTime = data.messageList[idx - 1]?.sendTime ?? 0;
        if (message.sessionType === SessionType.Notification) {
          (data.messageList[idx - 1] as ExMessageItem).gapTime =
            message.sendTime - prevTime > 300000;
        } else {
          message.gapTime = message.sendTime - prevTime > 300000;
        }
      });
      setLoadState((preState) => ({
        ...preState,
        hasMoreNew: !data.isEnd,
        messageList: removeRepeatedMessages([
          ...preState.messageList,
          ...data.messageList,
        ]),
      }));
    },
    {
      manual: true,
    },
  );

  const { loading: getMessageContextLoading, runAsync: getMessageContext } = useRequest(
    async (message: ExMessageItem, viewType: ViewType) => {
      const {
        data: { messageList },
      } = await IMSDK.fetchSurroundingMessages({
        startMessage: message,
        viewType,
        before: SPLIT_COUNT,
        after: SPLIT_COUNT,
      });
      messageList.map((message, idx) => {
        if (pendingClientMsgIDs.current.includes(message.clientMsgID)) {
          (message as ExMessageItem).isAppend = true;
        }
        if (!idx) return;
        const prevTime = messageList[idx - 1]?.sendTime ?? 0;
        (messageList[idx - 1] as ExMessageItem).gapTime =
          message.sendTime - prevTime > 300000;
      });
      const startMessageIdx = messageList.findIndex(
        (m) => m.clientMsgID === message.clientMsgID,
      );
      setLoadState((preState) => ({
        ...preState,
        initLoading: false,
        hasMoreOld: startMessageIdx === SPLIT_COUNT,
        hasMoreNew: messageList.length - startMessageIdx === SPLIT_COUNT + 1,
        messageList: messageList,
        firstItemIndex: START_INDEX - startMessageIdx,
      }));
      scrollToIndex(startMessageIdx);
    },
    {
      manual: true,
    },
  );

  return {
    SPLIT_COUNT,
    loadState,
    pushState,
    latestLoadState,
    conversationID,
    moreOldLoading,
    moreNewLoading,
    getMessageContextLoading,
    getMoreOldMessages,
    getMoreNewMessages,
    getMessageContext,
  };
}

const updateQuotedMessages = (messages: ExMessageItem[], clientMsgID: string) => {
  // update messages that quote this message
  messages.map((message, idx) => {
    const quoteMessage =
      message.quoteElem?.quoteMessage || message.atTextElem?.quoteMessage;
    if (quoteMessage?.clientMsgID === clientMsgID) {
      if (message.quoteElem?.quoteMessage) {
        messages[idx] = {
          ...message,
          quoteElem: {
            ...message.quoteElem,
            quoteMessage: {
              ...message.quoteElem.quoteMessage,
              contentType: MessageType.RevokeMessage,
            },
          },
        };
      } else {
        messages[idx] = {
          ...message,
          atTextElem: {
            ...message.atTextElem!,
            quoteMessage: {
              ...message.atTextElem!.quoteMessage!,
              contentType: MessageType.RevokeMessage,
            },
          },
        };
      }
    }
  });
};

const removeRepeatedMessages = (messages: ExMessageItem[]) => {
  const seen = new Set();
  return messages.filter((message) => {
    if (seen.has(message.clientMsgID)) {
      console.warn("remove repeated message:", message.clientMsgID);
      return false;
    }
    seen.add(message.clientMsgID);
    return true;
  });
};

export const pushNewMessage = (message: ExMessageItem) => emit("PUSH_NEW_MSG", message);
export const updateOneMessage = (message: ExMessageItem) =>
  emit("UPDATE_ONE_MSG", message);
export const updateMessageNicknameAndFaceUrl = (params: UpdateMessaggeBaseInfoParams) =>
  emit("UPDATE_MSG_NICK_AND_FACEURL", params);
export const deleteOneMessage = (clientMsgID: string) =>
  emit("DELETE_ONE_MSG", clientMsgID);
export const deleteMessagesByUser = (userID: string) =>
  emit("DELETE_MSG_BY_USER", userID);
export const deleteAndPushOneMessage = (message: ExMessageItem) =>
  emit("DELETE_AND_PUSH_ONE_MSG", message);
export const clearMessages = () => emit("CLEAR_MSGS");
export const clearMessageState = (key: keyof ExMessageItem) =>
  emit("CLEAR_MSG_STATE", key);
export const loadHistoryMessages = () => emit("LOAD_HISTORY_MSGS");
export const getMessageContext = (param: GetMessageContextParams) =>
  emit("GET_MSG_CONTEXT", param);
export const getMessageList = () =>
  new Promise<ExMessageItem[]>((resolve) => {
    emit("GET_MSG_LIST", (messages: ExMessageItem[]) => resolve(messages));
  });
export const syncNewMessages = () => emit("SYNC_NEW_MSGS");
