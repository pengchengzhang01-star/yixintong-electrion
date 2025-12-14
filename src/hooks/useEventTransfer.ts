import { SessionType, ViewType } from "@openim/wasm-client-sdk";
import { t } from "i18next";
import { useEffect } from "react";

import { message as antdMessage } from "@/AntdGlobalComp";
import { CustomMessageType } from "@/constants";
import { IMSDK } from "@/layout/MainContentWrap";
import {
  SendMessageParams,
  useSendMessage,
} from "@/pages/chat/queryChat/ChatFooter/useSendMessage";
import {
  getMessageContext,
  pushNewMessage,
  updateOneMessage,
} from "@/pages/chat/queryChat/useHistoryMessageList";
import {
  ExMessageItem,
  useConversationStore,
  useMessageStore,
  useUserStore,
} from "@/store";
import emitter, { CallStoreFunctionParams, RtcMessageData } from "@/utils/events";

import {
  ToSpecifiedConversationParams,
  useConversationToggle,
} from "./useConversationToggle";

export type ReadyJumpToHistoryParams = {
  message: ExMessageItem;
  viewType: ViewType;
};

export const useElectronEvent = () => {
  const onEventTransfer = ({ event, args }: { event: any; args: any }) => {
    emitter.emit(event, args);
  };
  useEffect(() => {
    const unsubscribeEmitTrasfer = window.electronAPI?.onEventTransfer(onEventTransfer);
    return () => {
      unsubscribeEmitTrasfer?.();
    };
  }, []);
};

export const useElectronDownloadHandler = () => {
  const { updateDownloadTask, removeDownloadTask, updateMessagePreview } =
    useMessageStore.getState();
  const { addImageCache } = useUserStore.getState();
  useEffect(() => {
    const downloadProgressHandler = (url: string, progress: number) => {
      const task = useMessageStore.getState().downloadMap[url];
      if (!task) return;
      updateDownloadTask(url, {
        progress,
      });
    };
    const downloadSuccessHandler = (url: string, savePath: string) => {
      const { clientMsgID, conversationID, originUrl, isMediaMessage, isThumb } =
        useMessageStore.getState().downloadMap[url];
      if (isThumb && originUrl) {
        addImageCache(originUrl, savePath);
      }

      const task = useMessageStore.getState().downloadMap[url];
      if (!task) return;
      updateDownloadTask(url, {
        progress: 0,
        downloadState: "finish",
      });

      setTimeout(() => removeDownloadTask(url), 2000);
      if (!clientMsgID || !conversationID) return;
      IMSDK.setMessageLocalEx({
        clientMsgID,
        conversationID,
        localEx: savePath,
      }).then(() => {
        const updatedMessage = {
          clientMsgID,
          localEx: savePath,
        } as ExMessageItem;
        updateOneMessage(updatedMessage);
        if (isMediaMessage) {
          updateMessagePreview(updatedMessage);
        }
      });
    };
    const downloadCancelHandler = (url: string) => {
      const task = useMessageStore.getState().downloadMap[url];
      if (!task) return;
      removeDownloadTask(url);
    };
    const downloadFailedHandler = (url: string) => {
      const task = useMessageStore.getState().downloadMap[url];
      if (!task) return;
      removeDownloadTask(url);
      if (task.showError) antdMessage.error(t("toast.applyDownloadFailed"));
    };
    const unsubscribeProgress = window.electronAPI?.onDownloadProgress(
      downloadProgressHandler,
    );
    const unsubscribeSuccess =
      window.electronAPI?.onDownloadSuccess(downloadSuccessHandler);
    const unsubscribeCancel =
      window.electronAPI?.onDownloadCancel(downloadCancelHandler);
    const unsubscribeFailed =
      window.electronAPI?.onDownloadFailed(downloadFailedHandler);
    return () => {
      unsubscribeProgress?.();
      unsubscribeSuccess?.();
      unsubscribeCancel?.();
      unsubscribeFailed?.();
    };
  }, []);
};

const useWindowEventHandler = () => {
  const { toSpecifiedConversation } = useConversationToggle();

  const { userLogout } = useUserStore.getState();
  const { updateJumpClientMsgID } = useMessageStore.getState();
  useEffect(() => {
    const onUserLogout = () => {
      userLogout();
    };

    const toConversation = ({
      sourceID,
      sessionType,
      isJump,
    }: ToSpecifiedConversationParams) => {
      window.electronAPI?.showMainWindow();
      toSpecifiedConversation({ sourceID, sessionType, isJump, isChildWindow: false });
    };

    const readyJumpToHistory = ({ message, viewType }: ReadyJumpToHistoryParams) => {
      setTimeout(() => {
        getMessageContext({
          message,
          viewType,
        });
      }, 50);
      updateJumpClientMsgID(message.clientMsgID);
    };

    const callStoreFunction = ({
      store,
      functionName,
      args,
    }: CallStoreFunctionParams) => {
      if (store === "contact") {
        const contactStore = useUserStore.getState();
        // @ts-ignore
        contactStore[functionName](...args);
      } else if (store === "conversation") {
        const conversationStore = useConversationStore.getState();
        // @ts-ignore
        conversationStore[functionName](...args);
      } else if (store === "message") {
        const messageStore = useMessageStore.getState();
        // @ts-ignore
        messageStore[functionName](...args);
      } else if (store === "user") {
        const userStore = useUserStore.getState();
        // @ts-ignore
        userStore[functionName](...args);
      }
    };

    emitter.on("USER_LOGOUT", onUserLogout);
    emitter.on("REPEAT_JUMP_TO_HISTORY", readyJumpToHistory);
    emitter.on("JUMP_TO_SPECIFIED_CONVERSATION", toConversation);
    emitter.on("CALL_STORE_FUNCTION", callStoreFunction);
    return () => {
      emitter.off("USER_LOGOUT", onUserLogout);
      emitter.on("REPEAT_JUMP_TO_HISTORY", readyJumpToHistory);
      emitter.off("JUMP_TO_SPECIFIED_CONVERSATION", toConversation);
      emitter.off("CALL_STORE_FUNCTION", callStoreFunction);
    };
  }, []);
};

const useMomentsWindowEventHandler = () => {
  const { updateWorkMomentsUnreadCount } = useUserStore.getState();
  useEffect(() => {
    const clearMomentsUnreadCount = () => {
      updateWorkMomentsUnreadCount(0);
    };

    emitter.on("CLEAR_MOMENTS_UNREAD_COUNT", clearMomentsUnreadCount);
    return () => {
      emitter.off("CLEAR_MOMENTS_UNREAD_COUNT", clearMomentsUnreadCount);
    };
  }, []);
};

// enterprise rtc
const useRtcWindowEventHandler = () => {
  const { sendMessage } = useSendMessage();

  useEffect(() => {
    const onInsertRtcMessage = async ({
      status,
      duration,
      invitation,
    }: RtcMessageData) => {
      if (invitation.sessionType !== SessionType.Single) return;
      const message = (
        await IMSDK.createCustomMessage({
          data: JSON.stringify({
            customType: CustomMessageType.Call,
            data: {
              duration,
              mediaType: invitation.mediaType,
              status,
            },
          }),
          extension: "",
          description: "",
        })
      ).data;
      if (!message) return;

      const fullMessage = (
        await IMSDK.insertSingleMessageToLocalStorage<ExMessageItem>({
          recvID: invitation.inviteeUserIDList[0],
          sendID: invitation.inviterUserID,
          message,
        })
      ).data;

      const conversation = useConversationStore.getState().currentConversation;
      if (
        invitation.inviterUserID === conversation?.userID ||
        invitation.inviteeUserIDList[0] === conversation?.userID
      ) {
        pushNewMessage(fullMessage);
      }
    };

    const onInsertMeetingMessage = ({
      message,
      recvID,
      groupID,
    }: SendMessageParams) => {
      console.error("onInsertMeetingMessage");
      sendMessage({
        message,
        recvID,
        groupID,
      });
    };

    emitter.on("INSERT_MEETING_MESSAGE", onInsertMeetingMessage);
    emitter.on("INSERT_RTC_MESSAGE", onInsertRtcMessage);
    return () => {
      emitter.off("INSERT_MEETING_MESSAGE", onInsertMeetingMessage);
      emitter.off("INSERT_RTC_MESSAGE", onInsertRtcMessage);
    };
  }, []);
};

export const useEventTransfer = () => {
  useElectronEvent();
  useElectronDownloadHandler();
  useWindowEventHandler();
  useMomentsWindowEventHandler();
  useRtcWindowEventHandler();
};
