import { MessageStatus, MessageType, SessionType } from "@openim/wasm-client-sdk";
import { GroupMemberItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { useHover, useInViewport, useRequest } from "ahooks";
import { Checkbox, Popover } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import clsx from "clsx";
import dayjs from "dayjs";
import { FC, memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import OIMAvatar from "@/components/OIMAvatar";
import { IMSDKErrCode, MessageRenderContext } from "@/constants";
import { useConversationToggle } from "@/hooks/useConversationToggle";
import { IMSDK } from "@/layout/MainContentWrap";
import {
  ExMessageItem,
  useConversationStore,
  useMessageStore,
  useUserStore,
} from "@/store";
import { emit } from "@/utils/events";
import { formatMessageTime } from "@/utils/imCommon";

import { updateOneMessage } from "../useHistoryMessageList";
import AnnouncementRenderer from "./AnnouncementRender";
import CardMessageRenderer from "./CardMessageRenderer";
import CatchMessageRender from "./CatchMsgRenderer";
import CustomMessageSwitcher from "./CustomMessageSwitcher";
import FaceMessageRender from "./FaceMessageRender";
import FileMessageRenderer from "./FileMessageRenderer";
import LocationMessageRenderer from "./LocationMessageRenderer";
import MediaMessageRender from "./MediaMessageRender";
import MergeMessageRenderer from "./MergeMessageRenderer";
import styles from "./message-item.module.scss";
import MessageItemErrorBoundary from "./MessageItemErrorBoundary";
import MessageMenuContent from "./MessageMenuContent";
import MessageReadState from "./MessageReadState";
import MessageSuffix from "./MessageSuffix";
import NomalMarkdownRender from "./NomalMarkdownRender";
import QuoteMessageRenderer from "./QuoteMessageRenderer";
import StreamMessageRender from "./StreamMessageRender";
import TextMessageRender, { EditState } from "./TextMessageRender";
import VoiceMessageRender from "./VoiceMessageRender";

export interface IMessageItemProps {
  message: ExMessageItem;
  isSender: boolean;
  conversationID?: string;
  messageUpdateFlag?: string;
  showAlbum?: (clientMsgID: string) => void;
  renderContext?: MessageRenderContext;
}

const canEditTypes = [
  MessageType.TextMessage,
  MessageType.TextMessage,
  MessageType.AtTextMessage,
  MessageType.QuoteMessage,
];
const components: Record<number, FC<IMessageItemProps>> = {
  [MessageType.TextMessage]: TextMessageRender,
  [MessageType.AtTextMessage]: TextMessageRender,
  [MessageType.QuoteMessage]: TextMessageRender,
  [MessageType.MarkdownMessage]: NomalMarkdownRender,
  [MessageType.StreamMessage]: StreamMessageRender,
  [MessageType.VoiceMessage]: VoiceMessageRender,
  [MessageType.PictureMessage]: MediaMessageRender,
  [MessageType.VideoMessage]: MediaMessageRender,
  [MessageType.FaceMessage]: FaceMessageRender,
  [MessageType.CardMessage]: CardMessageRenderer,
  [MessageType.FileMessage]: FileMessageRenderer,
  [MessageType.CustomMessage]: CustomMessageSwitcher,
  [MessageType.LocationMessage]: LocationMessageRenderer,
  [MessageType.MergeMessage]: MergeMessageRenderer,
  [MessageType.GroupAnnouncementUpdated]: AnnouncementRenderer,
};

const MessageItem: FC<IMessageItemProps> = ({
  message,
  isSender,
  conversationID,
  showAlbum,
  renderContext,
}) => {
  const messageWrapRef = useRef<HTMLDivElement>(null);
  const textMessageRef = useRef<{ updateEditState: (state: EditState) => void }>();
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showAvatorMenu, setShowAvatorMenu] = useState(false);
  const isCheckMode = useMessageStore((state) => state.isCheckMode);
  const jumpClientMsgID = useMessageStore((state) => state.jumpClientMsgID);
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const MessageRenderComponent = components[message.contentType] || CatchMessageRender;

  // locale re render
  useUserStore((state) => state.appSettings.locale);
  const { t } = useTranslation();

  const isQuoteMessage =
    message.contentType === MessageType.QuoteMessage ||
    message.atTextElem?.quoteMessage;

  const isShowAsRead =
    message.sessionType === SessionType.Single ||
    (message.sessionType === SessionType.Group && currentGroupInfo?.displayIsRead);

  const [inViewport] = useInViewport(messageWrapRef, {
    root: document.getElementById("chat-main"),
  });

  const isHovering = useHover(messageWrapRef);

  const { runAsync: markGroupMessageAsRead, loading: markGroupMessageAsReadLoading } =
    useRequest(IMSDK.sendGroupMessageReadReceipt, {
      manual: true,
    });

  useEffect(() => {
    if (renderContext !== MessageRenderContext.Chat || isSender || !inViewport) return;
    updateMessageAppendState();
    updateMessageReadState();
  }, [
    inViewport,
    isSender,
    message.isAppend,
    message.isRead,
    message.seq,
    markGroupMessageAsReadLoading,
    renderContext,
  ]);

  const onCheckChange = (e: CheckboxChangeEvent) => {
    updateOneMessage({
      ...message,
      checked: e.target.checked,
    } as ExMessageItem);
  };

  const tryShowUserCard = useCallback(() => {
    if (
      renderContext === MessageRenderContext.Chat ||
      renderContext === MessageRenderContext.MergeMessage
    ) {
      window.userClick(message.sendID, message.groupID);
    }
  }, []);

  const updateMessageAppendState = () => {
    if (!message.isAppend) return;
    const updateFields = {
      clientMsgID: message.clientMsgID,
      isAppend: false,
    } as ExMessageItem;
    if (message.sessionType === SessionType.Single) {
      updateFields.isRead = true;
    }
    updateOneMessage(updateFields);
    emit("UPDATE_IS_HAS_NEW_MESSAGES", false);
  };

  const updateMessageReadState = () => {
    if (
      markGroupMessageAsReadLoading ||
      message.isRead ||
      message.seq === 0 ||
      message.contentType === MessageType.GroupAnnouncementUpdated
    )
      return;

    if (message.groupID && isShowAsRead) {
      markGroupMessageAsRead({
        conversationID: conversationID ?? "",
        clientMsgIDList: [message.clientMsgID],
      });
    }
    updateOneMessage({
      clientMsgID: message.clientMsgID,
      isRead: true,
    } as ExMessageItem);
  };

  const closeMessageMenu = useCallback(() => {
    setShowMessageMenu(false);
  }, []);

  const messageIsSuccess = message.status === MessageStatus.Succeed;
  const isAnnouncement = message.contentType === MessageType.GroupAnnouncementUpdated;
  const isCustomMessage = message.contentType === MessageType.CustomMessage;
  const showMessageReadState =
    isSender && messageIsSuccess && !isAnnouncement && !isCustomMessage && isShowAsRead;
  const canShowMessageMenu =
    renderContext === MessageRenderContext.Chat && !isAnnouncement;

  return (
    <>
      {message.gapTime && (
        <div className="py-2 text-center text-xs text-[var(--sub-text)]">
          {formatMessageTime(message.sendTime, true)}
        </div>
      )}
      <div
        id={`chat_${message.clientMsgID}`}
        className={clsx(
          "relative flex select-text px-5 py-3",
          message.errCode && "!pb-6",
          isCheckMode && "cursor-pointer",
          jumpClientMsgID === message.clientMsgID && styles["animate-container"],
          message.checked && "bg-gray-100",
        )}
        onClick={() =>
          isCheckMode &&
          onCheckChange({
            target: { checked: !message.checked },
          } as CheckboxChangeEvent)
        }
      >
        {isCheckMode && (
          <Checkbox
            checked={message.checked}
            disabled={isAnnouncement}
            onChange={onCheckChange}
            className="pointer-events-none mr-5 h-9"
          />
        )}
        <div
          className={clsx(
            styles["message-container"],
            isSender && styles["message-container-sender"],
            isCheckMode && "pointer-events-none",
          )}
        >
          <Popover
            className={styles["menu-wrap"]}
            content={
              <MessageAvatarMenuContent
                senderNickname={message.senderNickname}
                sourceID={message.sendID}
                closeContent={() => setShowAvatorMenu(false)}
              />
            }
            title={null}
            trigger="contextMenu"
            placement="bottomLeft"
            open={message.groupID ? showAvatorMenu : false}
            onOpenChange={(vis) => setShowAvatorMenu(vis)}
          >
            <OIMAvatar
              size={36}
              src={message.senderFaceUrl}
              text={message.senderNickname}
              onClick={tryShowUserCard}
            />
          </Popover>

          <div className={styles["message-wrap"]} ref={messageWrapRef}>
            <div className={styles["message-profile"]}>
              {!isSender && (
                <span
                  title={message.senderNickname}
                  className={clsx("max-w-[30%] truncate")}
                >
                  {message.senderNickname}
                </span>
              )}
              {message.attachedInfoElem?.lastModified && (
                <span>{t("placeholder.edited")}</span>
              )}
            </div>

            <Popover
              className={styles["menu-wrap"]}
              overlayClassName="app-no-drag"
              content={
                <MessageMenuContent
                  message={message}
                  conversationID={conversationID!}
                  closeMenu={closeMessageMenu}
                  editMessage={() => textMessageRef.current?.updateEditState("edit")}
                />
              }
              title={null}
              trigger="contextMenu"
              open={canShowMessageMenu ? showMessageMenu : false}
              onOpenChange={(vis) => setShowMessageMenu(vis)}
            >
              <MessageItemErrorBoundary message={message}>
                <MessageRenderComponent
                  // @ts-ignore
                  ref={
                    canEditTypes.includes(message.contentType)
                      ? textMessageRef
                      : undefined
                  }
                  message={message}
                  isSender={isSender}
                  conversationID={conversationID}
                  showAlbum={showAlbum}
                  renderContext={renderContext}
                />
              </MessageItemErrorBoundary>

              <MessageSuffix
                message={message}
                isSender={isSender}
                conversationID={conversationID}
              />

              <div
                className={clsx(
                  "invisible mt-3.5 text-xs text-[var(--sub-text)]",
                  isHovering && "!visible",
                )}
              >
                {dayjs(message.sendTime).format("HH:mm")}
              </div>
            </Popover>

            {isQuoteMessage && (
              <QuoteMessageRenderer
                message={message}
                isSender={isSender}
                renderContext={renderContext}
              />
            )}

            {showMessageReadState && (
              <MessageReadState
                message={message}
                isSender={isSender}
                renderContext={renderContext}
              />
            )}
          </div>
        </div>
        {Number(message.errCode) === IMSDKErrCode.Blacked && (
          <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center text-xs">
            <div className="text-xs text-[var(--sub-text)]">
              {t("toast.beingBlacklist")}
            </div>
            {Number(message.errCode) === IMSDKErrCode.NotFriend && (
              <>
                <div className="text-[var(--sub-text)]">
                  {t("toast.usingFriendVerification")}
                </div>
                <div className="ml-2 cursor-pointer text-[var(--primary)]">
                  {t("placeholder.verifyAdd")}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default memo(MessageItem);

const MessageAvatarMenuContent = memo(
  ({
    sourceID,
    senderNickname,
    closeContent,
  }: {
    sourceID: string;
    senderNickname: string;
    closeContent: () => void;
  }) => {
    const { t } = useTranslation();

    const { toSpecifiedConversation } = useConversationToggle();

    const triggerAt = () => {
      emit("TRIGGER_GROUP_AT", {
        userID: sourceID,
        nickname: senderNickname,
      } as GroupMemberItem);
      closeContent();
    };

    return (
      <div className="p-1">
        <div
          className="max-w-[120px] cursor-pointer truncate rounded px-3 py-2 text-xs hover:bg-[var(--primary-active)]"
          onClick={triggerAt}
        >
          {`@${senderNickname}`}
        </div>
        <div
          className="cursor-pointer rounded px-3 py-2 text-xs hover:bg-[var(--primary-active)]"
          onClick={() =>
            toSpecifiedConversation({ sourceID, sessionType: SessionType.Single })
          }
        >
          {t("placeholder.sendMessage")}
        </div>
      </div>
    );
  },
);
