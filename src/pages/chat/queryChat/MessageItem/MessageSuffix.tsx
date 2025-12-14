import { ExclamationCircleFilled, LoadingOutlined } from "@ant-design/icons";
import { MessageStatus, MessageType } from "@openim/wasm-client-sdk";
import { Spin } from "antd";
import { FC, useEffect, useState } from "react";

import { IMSDK } from "@/layout/MainContentWrap";
import { ExMessageItem } from "@/store";

import { useSendMessage } from "../ChatFooter/useSendMessage";
import { deleteOneMessage } from "../useHistoryMessageList";
import { usePrivateMessageCount } from "../usePrivateMessageCount";
import { IMessageItemProps } from ".";

const MessageSuffix: FC<IMessageItemProps> = ({ message }) => {
  const [showSending, setShowSending] = useState(false);

  const { sendMessage } = useSendMessage();
  const { counts, addDestroyTime } = usePrivateMessageCount();

  const isShowLimitTimer = message.isRead && message.attachedInfoElem?.isPrivateChat;

  useEffect(() => {
    if (message.status !== MessageStatus.Sending) return;
    const timer = setTimeout(() => {
      if (message.status === MessageStatus.Sending) {
        setShowSending(true);
      }
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [message.status]);

  useEffect(() => {
    if (!isShowLimitTimer) return;
    addDestroyTime(message.clientMsgID, message.attachedInfoElem?.burnDuration || 30);
  }, [isShowLimitTimer]);

  const reSend = async () => {
    deleteOneMessage(message.clientMsgID);
    await checkResendFile(message);
    sendMessage({
      message: { ...message, status: MessageStatus.Sending },
      isResend: true,
    });
  };

  const isFileTypeMessage = fileTypes.includes(message.contentType);
  const count = Number(counts[message.clientMsgID]) || 0;

  return (
    <div className="flex items-center">
      {showSending &&
        message.status === MessageStatus.Sending &&
        !isFileTypeMessage && (
          <Spin
            className="flex"
            indicator={
              <LoadingOutlined style={{ fontSize: 16 }} spin rev={undefined} />
            }
          />
        )}
      {message.status === MessageStatus.Failed && (
        <ExclamationCircleFilled
          className="text-base text-[var(--warn-text)]"
          rev={undefined}
          onClick={reSend}
        />
      )}
      {isShowLimitTimer && (
        <div className="text-xs text-[var(--sub-text)]">{`${count}s`}</div>
      )}
    </div>
  );
};

export default MessageSuffix;

const getSourcePath = (message: ExMessageItem) => {
  if (message.contentType === MessageType.PictureMessage) {
    return {
      uuid: message.pictureElem!.sourcePicture.uuid,
      path: message.pictureElem!.sourcePath,
    };
  }
  if (message.contentType === MessageType.VideoMessage) {
    return {
      uuid: message.videoElem!.videoUUID,
      path: message.videoElem!.videoPath,
      snapshotPath: message.videoElem!.snapshotPath,
      snapshotUUID: message.videoElem!.snapshotUUID,
    };
  }
  return {
    uuid: message.fileElem!.uuid,
    path: message.fileElem!.filePath,
  };
};

const fileTypes = [
  MessageType.PictureMessage,
  MessageType.VideoMessage,
  MessageType.FileMessage,
];
const checkResendFile = async (message: ExMessageItem) => {
  if (!window.electronAPI || !fileTypes.includes(message.contentType)) return;
  const { uuid, path, snapshotPath, snapshotUUID } = getSourcePath(message);
  const sourceFile = await window.electronAPI?.getFileByPath(path);
  console.log(path, sourceFile);

  let snapshotFile;
  if (snapshotPath) {
    snapshotFile = await window.electronAPI?.getFileByPath(snapshotPath);
  }
  if (!sourceFile || (snapshotPath && !snapshotFile)) return;
  IMSDK.fileMapSet(uuid, sourceFile);
  if (snapshotUUID && snapshotFile) {
    IMSDK.fileMapSet(snapshotUUID, snapshotFile);
  }
};
