import { MessageType, ViewType } from "@openim/wasm-client-sdk";
import clsx from "clsx";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import file_icon from "@/assets/images/messageItem/file_icon.png";
import location from "@/assets/images/messageItem/location.png";
import CacheImage from "@/components/CacheImage";
import JumpToMessageWrap from "@/components/JumpToMessageWrap";
import OIMAvatar from "@/components/OIMAvatar";
import Twemoji from "@/components/Twemoji";
import { MessageRenderContext } from "@/constants";
import { useMessageFileDownloadState } from "@/hooks/useMessageFileDownloadState";
import { useCommonModal } from "@/pages/common";
import { ExMessageItem } from "@/store";
import FileDownloadIcon from "@/svg/FileDownloadIcon";
import { escapeHtml } from "@/utils/common";
import { formatLink, formatMessageByType } from "@/utils/imCommon";

import { IMessageItemProps } from ".";

const extraTypes = [
  MessageType.FileMessage,
  MessageType.LocationMessage,
  MessageType.PictureMessage,
  MessageType.VideoMessage,
  MessageType.CardMessage,
];

const QuoteMessageRenderer: FC<IMessageItemProps> = ({ message, renderContext }) => {
  const { t } = useTranslation();
  const { conversationID } = useParams();
  const quoteMessage =
    message.quoteElem?.quoteMessage || message.atTextElem!.quoteMessage!;
  const hasExtra = extraTypes.includes(quoteMessage.contentType);

  const isFileMessage = quoteMessage.contentType === MessageType.FileMessage;
  const isPictureMessage = quoteMessage.contentType === MessageType.PictureMessage;
  const isVideoMessage = quoteMessage.contentType === MessageType.VideoMessage;
  const isMediaMessage = isPictureMessage || isVideoMessage;
  const isCardMessage = quoteMessage.contentType === MessageType.CardMessage;
  const isLocationMessage = quoteMessage.contentType === MessageType.LocationMessage;
  const isRevokedMessage = quoteMessage.contentType === MessageType.RevokeMessage;

  const getMessageContent = () => {
    if (isMediaMessage) {
      return "";
    }
    if (isRevokedMessage) {
      return t("messageDescription.quoteMessageRevoke");
    }
    return formatLink(escapeHtml(formatMessageByType(quoteMessage)));
  };

  const RenderContent = (
    <div
      className={clsx(
        "mt-1 flex w-fit items-center rounded-md bg-[var(--chat-bubble)] p-2.5",
        {
          "py-1.5": hasExtra,
        },
      )}
    >
      <Twemoji>
        <div
          className="line-clamp-2 break-all text-xs text-[var(--sub-text)]"
          dangerouslySetInnerHTML={{
            __html: `<span class="truncate max-w-[200px] inline-block align-middle">${
              quoteMessage.senderNickname
            }</span>：${getMessageContent()}`,
          }}
        ></div>
      </Twemoji>
      {hasExtra && (
        <div className={clsx({ "pl-1.5": !isMediaMessage })}>
          {isFileMessage && <img width={26} src={file_icon} alt="file" />}
          {isLocationMessage && <img width={14} src={location} alt="location" />}
          {isCardMessage && <CardExtra message={quoteMessage} />}
          {isMediaMessage && <MediaExtra message={quoteMessage} />}
        </div>
      )}
    </div>
  );

  return renderContext !== MessageRenderContext.Chat ? (
    RenderContent
  ) : (
    <JumpToMessageWrap
      viewType={ViewType.History}
      message={quoteMessage}
      isChildWindow={false}
      conversationID={conversationID!}
    >
      {RenderContent}
    </JumpToMessageWrap>
  );
};

export default QuoteMessageRenderer;

const CardExtra: FC<{ message: ExMessageItem }> = ({ message }) => (
  <OIMAvatar
    className="cursor-pointer"
    onClick={() => window.userClick(message.cardElem?.userID)}
    src={message.cardElem!.faceURL}
    size={26}
    text={message.cardElem!.nickname}
  />
);

const MediaExtra: FC<{ message: ExMessageItem }> = ({ message }) => {
  const { showVideoPlayer } = useCommonModal();
  const isVideoMessage = message.contentType === MessageType.VideoMessage;

  const previewInPlayer = (path: string) => {
    showVideoPlayer(`file://${path}`);
  };

  const { progress, downloadState, tryDownload } = useMessageFileDownloadState(
    message,
    previewInPlayer,
  );

  const getSourceUrl = (isOrigin = false) => {
    if (
      !isVideoMessage &&
      message.localEx &&
      window.electronAPI?.fileExists(message.localEx)
    ) {
      return `file://${message.localEx}`;
    }
    if (
      !isVideoMessage &&
      message.pictureElem!.sourcePath &&
      window.electronAPI?.fileExists(message.pictureElem!.sourcePath)
    ) {
      return `file://${message.pictureElem!.sourcePath}`;
    }
    if (isOrigin) {
      return message.pictureElem?.sourcePicture.url ?? "";
    }
    const videoUrl = message.videoElem?.snapshotUrl ?? "";
    const imageUrl = message.pictureElem?.sourcePicture.url ?? "";
    return isVideoMessage ? videoUrl : imageUrl;
  };

  const tryPlayVideo = () => {
    if (window.electronAPI) {
      tryDownload();
      return;
    }
    showVideoPlayer(message.videoElem!.videoUrl);
  };

  return (
    <div className="relative flex items-center">
      <CacheImage
        rootClassName="message-image quote-image"
        className="rounded-md"
        height={30}
        src={getSourceUrl()}
        preview={
          isVideoMessage
            ? false
            : {
                src: getSourceUrl(true),
              }
        }
      />
      {isVideoMessage && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          onClick={tryPlayVideo}
        >
          <FileDownloadIcon
            size={13}
            pausing={downloadState === "pause"}
            finished={downloadState === "finish" || !window.electronAPI}
            percent={progress}
          />
        </div>
      )}
    </div>
  );
};
