import { SessionType } from "@openim/wasm-client-sdk";
import { Layout, Spin } from "antd";
import clsx from "clsx";
import { memo, useCallback, useRef } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

import { MessageRenderContext, SystemMessageTypes } from "@/constants/im";
import { useMessageStore, useUserStore } from "@/store";

import ForwardMediaPreview from "./MediaPreview";
import MessageItem from "./MessageItem";
import NotificationMessage from "./NotificationMessage";
import SystemNotification from "./SystemNotification";
import UnreadMessageSlider from "./UnreadMessageSlider";
import { useHistoryMessageList } from "./useHistoryMessageList";
import { PrivateMessageCountProvider } from "./usePrivateMessageCount";

const ChatContent = ({ isNotificationSession }: { isNotificationSession: boolean }) => {
  const virtuoso = useRef<VirtuosoHandle>(null);
  const mediaPreviewRef = useRef<{ showAlbum: (clientMsgID: string) => void }>(null);
  const selfUserID = useUserStore((state) => state.selfInfo.userID);
  const isSearchMode = useMessageStore((state) => Boolean(state.jumpClientMsgID));

  const scrollToIndex = (index: number) => {
    setTimeout(
      () =>
        virtuoso.current?.scrollToIndex({
          index,
          align: "center",
        }),
      index < 20 ? 150 : 0,
    );
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      virtuoso.current?.scrollToIndex({
        index: 9999,
        align: "end",
        behavior: "auto",
      });
    });
  };

  const {
    SPLIT_COUNT,
    conversationID,
    loadState,
    pushState,
    moreNewLoading,
    moreOldLoading,
    getMessageContextLoading,
    getMoreOldMessages,
    getMoreNewMessages,
  } = useHistoryMessageList({ scrollToIndex });

  const loadMoreMessage = () => {
    if (!loadState.hasMoreOld || moreOldLoading) return;

    getMoreOldMessages();
  };

  const prevLoad = () => {
    if (
      !useMessageStore.getState().jumpClientMsgID ||
      !loadState.hasMoreNew ||
      moreNewLoading
    )
      return;

    getMoreNewMessages();
  };

  const showAlbum = useCallback(
    (clientMsgID: string) => mediaPreviewRef.current?.showAlbum(clientMsgID),
    [],
  );

  const loading = loadState.initLoading || getMessageContextLoading;

  return (
    <Layout.Content
      className="relative flex h-full overflow-hidden !bg-white"
      id="chat-main"
    >
      <PrivateMessageCountProvider>
        {loading ? (
          <div className="flex h-full w-full items-center justify-center bg-white pt-1">
            <Spin spinning />
          </div>
        ) : (
          <Virtuoso
            id="chat-list"
            className="w-full overflow-x-hidden"
            followOutput={() => {
              if (isSearchMode || document.hidden || !pushState.current) {
                return false;
              }
              return true;
            }}
            firstItemIndex={loadState.firstItemIndex}
            initialTopMostItemIndex={SPLIT_COUNT - 1}
            startReached={loadMoreMessage}
            endReached={prevLoad}
            ref={virtuoso}
            data={loadState.messageList}
            components={{
              Header: () =>
                loadState.hasMoreOld ? (
                  <div
                    className={clsx(
                      "flex justify-center py-2 opacity-0",
                      moreOldLoading && "opacity-100",
                    )}
                  >
                    <Spin />
                  </div>
                ) : null,
            }}
            computeItemKey={(_, item) => item.clientMsgID}
            itemContent={(_, message) => {
              if (message.sessionType === SessionType.Notification) {
                return (
                  <SystemNotification key={message.clientMsgID} message={message} />
                );
              }

              if (SystemMessageTypes.includes(message.contentType)) {
                return (
                  <NotificationMessage key={message.clientMsgID} message={message} />
                );
              }
              const isSender = selfUserID === message.sendID;
              return (
                <MessageItem
                  key={message.clientMsgID}
                  conversationID={conversationID}
                  message={message}
                  messageUpdateFlag={message.senderNickname + message.senderFaceUrl}
                  isSender={isSender}
                  showAlbum={showAlbum}
                  renderContext={MessageRenderContext.Chat}
                />
              );
            }}
          />
        )}
      </PrivateMessageCountProvider>
      <UnreadMessageSlider scrollToBottom={scrollToBottom} />
      <ForwardMediaPreview
        ref={mediaPreviewRef}
        conversationID={conversationID ?? ""}
      />
    </Layout.Content>
  );
};

export default memo(ChatContent);
