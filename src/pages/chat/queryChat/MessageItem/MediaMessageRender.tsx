import { MessageStatus, MessageType } from "@openim/wasm-client-sdk";
import { useDrag } from "ahooks";
import { Spin } from "antd";
import { FC, useRef, useState } from "react";

import CacheImage from "@/components/CacheImage";
import { MessageRenderContext } from "@/constants";
import {
  getSourceData,
  useMessageFileDownloadState,
} from "@/hooks/useMessageFileDownloadState";
import { useCommonModal } from "@/pages/common";
import FileDownloadIcon from "@/svg/FileDownloadIcon";
import { secondsToMS } from "@/utils/common";

import { IMessageItemProps } from ".";
import { useMessageUploadProgress } from "./useMessageUploadProgress";

const min = (a: number, b: number) => (a > b ? b : a);

const MediaMessageRender: FC<IMessageItemProps> = ({
  message,
  showAlbum,
  renderContext,
}) => {
  const { showVideoPlayer } = useCommonModal();
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const { progress, downloadState } = useMessageFileDownloadState(message);
  const uploadProgress = useMessageUploadProgress(message.clientMsgID);

  const isVideoMessage = message.contentType === MessageType.VideoMessage;
  const imageHeight = isVideoMessage
    ? message.videoElem!.snapshotHeight
    : message.pictureElem!.sourcePicture.height;
  const imageWidth = isVideoMessage
    ? message.videoElem!.snapshotWidth
    : message.pictureElem!.sourcePicture.width;
  const snapshotMaxHeight = isVideoMessage
    ? 320
    : message.pictureElem!.snapshotPicture?.height ?? imageHeight;
  const minHeight = min(200, imageWidth) * (imageHeight / imageWidth) + 2;
  const adaptedHight = min(minHeight, snapshotMaxHeight) + 10;
  const adaptedWidth = min(imageWidth, 200) + 10;

  const isSucceed = message.status === MessageStatus.Succeed;
  const avoidPreview = renderContext === MessageRenderContext.CollectionPreview;

  useDrag({ message }, dragRef, {
    onDragStart: () => {
      setDragging(true);
    },
    onDragEnd: () => {
      setDragging(false);
    },
  });

  const previewInAlbum = () => {
    showAlbum?.(message.clientMsgID);
    if (!showAlbum && isVideoMessage && !avoidPreview) {
      showVideoPlayer(message.videoElem!.videoUrl);
    }
  };

  const getShowPreview = () => {
    if (isVideoMessage || dragging || avoidPreview) {
      return false;
    }
    return showAlbum ? { visible: false } : true;
  };

  const getSourceUrl = () => {
    if (
      !isVideoMessage &&
      message.localEx &&
      window.electronAPI?.fileExists(message.localEx)
    ) {
      return message.localEx;
    }
    if (
      !isVideoMessage &&
      message.pictureElem!.sourcePath &&
      window.electronAPI?.fileExists(message.pictureElem!.sourcePath)
    ) {
      return message.pictureElem!.sourcePath;
    }
    if (
      isVideoMessage &&
      message.videoElem!.snapshotPath &&
      window.electronAPI?.fileExists(message.videoElem!.snapshotPath)
    ) {
      return message.videoElem!.snapshotPath;
    }
    return isVideoMessage
      ? message.videoElem!.snapshotUrl
      : message.pictureElem!.snapshotPicture.url;
  };

  const isSending = message.status === MessageStatus.Sending;
  const minStyle = { minHeight: `${adaptedHight}px`, minWidth: `${adaptedWidth}px` };

  const { path } = getSourceData(message);
  const isFileExists = window.electronAPI?.fileExists(path);

  return (
    <Spin spinning={isSending} tip={`${uploadProgress}%`}>
      <div className="relative max-w-[200px]" style={minStyle} ref={dragRef}>
        <CacheImage
          rootClassName="message-image cursor-pointer"
          className="max-w-[200px] rounded-md"
          src={getSourceUrl()}
          preview={getShowPreview()}
          onClick={previewInAlbum}
          placeholder={
            <div style={minStyle} className="flex items-center justify-center">
              <Spin />
            </div>
          }
        />
        {isVideoMessage && (
          <div className="absolute bottom-3 right-4 text-white">
            {secondsToMS(message.videoElem!.duration)}
          </div>
        )}
        {isVideoMessage && isSucceed && (
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            onClick={previewInAlbum}
          >
            <FileDownloadIcon
              size={40}
              pausing={downloadState === "pause"}
              finished={
                isFileExists || downloadState === "finish" || !window.electronAPI
              }
              percent={progress}
            />
          </div>
        )}
      </div>
    </Spin>
  );
};

export default MediaMessageRender;
