import { InfoCircleOutlined } from "@ant-design/icons";
import { SessionType } from "@openim/wasm-client-sdk";
import { useUnmount } from "ahooks";
import { Layout } from "antd";
import { t } from "i18next";
import { useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useMessageStore } from "@/store";

import ChatContent from "./ChatContent";
import ChatFooter, { ChatFooterHandle } from "./ChatFooter";
import MultipleActionBar from "./ChatFooter/MultipleActionBar";
import ChatHeader from "./ChatHeader";
import useConversationState from "./useConversationState";
import { useDropAndPaste } from "./useDropAndPaste";
import { useMessageReceipt } from "./useMessageReceipt";

export const QueryChat = () => {
  const isCheckMode = useMessageStore((state) => state.isCheckMode);
  const updateCurrentConversation = useConversationStore(
    (state) => state.updateCurrentConversation,
  );
  const chatFooterRef = useRef<ChatFooterHandle>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    agent,
    getIsCanSendMessage,
    isMutedGroup,
    currentIsMuted,
    isBlackUser,
    currentConversation,
  } = useConversationState();
  useMessageReceipt();

  const isNotificationSession =
    currentConversation?.conversationType === SessionType.Notification;

  const { droping } = useDropAndPaste({
    currentConversation,
    insertImage: (attributes) => chatFooterRef.current?.insertImage(attributes),
    getIsCanSendMessage,
  });

  useUnmount(() => {
    updateCurrentConversation();
  });

  const switchFooter = () => {
    if (isNotificationSession) {
      return null;
    }
    if (isCheckMode) {
      return <MultipleActionBar />;
    }
    if (!getIsCanSendMessage()) {
      let tip = t("toast.notCanSendMessage");
      if (isMutedGroup) tip = t("toast.groupMuted");
      if (currentIsMuted) tip = t("toast.currentMuted");
      if (isBlackUser) tip = t("toast.userBlacked");

      if (currentConversation?.draftText) {
        IMSDK.setConversationDraft({
          conversationID: currentConversation.conversationID,
          draftText: "",
        });
      }

      return (
        <div className="flex justify-center py-4.5 text-xs text-[var(--sub-text)]">
          <InfoCircleOutlined rev={undefined} />
          <span className="ml-1">{tip}</span>
        </div>
      );
    }

    return (
      <>
        <PanelResizeHandle />
        <Panel
          id="chat-footer"
          order={1}
          defaultSize={25}
          maxSize={60}
          className="min-h-[200px] !overflow-visible"
        >
          <ChatFooter agent={agent} ref={chatFooterRef} />
        </Panel>
      </>
    );
  };

  return (
    <Layout
      ref={chatContainerRef}
      id="chat-container"
      className="relative overflow-hidden"
    >
      <ChatHeader agent={agent} isBlackUser={isBlackUser} />
      <PanelGroup direction="vertical">
        <Panel id="chat-main" order={0}>
          <ChatContent isNotificationSession={isNotificationSession} />
        </Panel>
        {switchFooter()}
      </PanelGroup>

      {droping && (
        <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-[rgba(248,229,229,0.4)]">
          <div className="max-w-[200px] truncate text-[var(--sub-text)]">{`${t(
            "placeholder.loosenToSend",
          )} ${currentConversation?.showName}`}</div>
        </div>
      )}
    </Layout>
  );
};
