import { MessageStatus } from "@openim/wasm-client-sdk";
import { useDrag } from "ahooks";
import { Spin } from "antd";
import { FC, useRef } from "react";

import file_icon from "@/assets/images/messageItem/file_icon.png";
import { MessageRenderContext } from "@/constants";
import { useMessageFileDownloadState } from "@/hooks/useMessageFileDownloadState";
import { useMessageStore } from "@/store";
import FileDownloadIcon from "@/svg/FileDownloadIcon";
import { bytesToSize, getDownloadTask } from "@/utils/common";

import { IMessageItemProps } from ".";
import { useMessageUploadProgress } from "./useMessageUploadProgress";

const FileMessageRenderer: FC<IMessageItemProps> = ({ message, renderContext }) => {
  const { fileElem } = message;
  const dragRef = useRef(null);

  const { downloadState, tryDownload } = useMessageFileDownloadState(message);

  const currentTask = useMessageStore((state) =>
    getDownloadTask({
      downloadMap: state.downloadMap,
      compareKey: "clientMsgID",
      compareValue: message.clientMsgID,
    }),
  );

  const uploadProgress = useMessageUploadProgress(message.clientMsgID);

  const isSending = message.status === MessageStatus.Sending;
  const isSucceed = message.status === MessageStatus.Succeed;
  const avoidPreview = renderContext === MessageRenderContext.CollectionPreview;

  // useDrag({ message }, dragRef, {
  // onDragStart: (e) => {
  //   const filePath = message.localEx || message.fileElem?.filePath;
  //   if (filePath && window.electronAPI?.fileExists(filePath)) {
  //     e.preventDefault();
  //     window.electronAPI.dragFile(, filePath);
  //   }
  // },
  // });

  const showDownloadProgressTypes = ["downloading", "pause", "resume"];
  const showDownloadProgress = showDownloadProgressTypes.includes(downloadState);

  return (
    <Spin spinning={isSending} tip={`${uploadProgress}%`}>
      <div
        ref={dragRef}
        onClick={avoidPreview ? undefined : tryDownload}
        className="flex w-60 cursor-pointer items-center justify-between rounded-md border border-[var(--gap-text)]  p-3"
      >
        <div className="mr-2 flex h-full flex-1 flex-col justify-between overflow-hidden">
          <div data-drag="app-drag" className="line-clamp-2 break-all">
            {fileElem!.fileName}
          </div>
          <div data-drag="app-drag" className="text-xs text-[var(--sub-text)]">
            {bytesToSize(fileElem!.fileSize)}
          </div>
        </div>
        <div className="relative min-w-[38px]">
          <img width={38} src={file_icon} alt="file" data-drag="app-drag" />
          {!avoidPreview && isSucceed && downloadState !== "finish" && (
            <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center rounded-md bg-[rgba(0,0,0,.4)]">
              <FileDownloadIcon
                pausing={downloadState === "pause"}
                percent={!showDownloadProgress ? 0 : currentTask?.progress || 0}
              />
            </div>
          )}
        </div>
      </div>
    </Spin>
  );
};

export default FileMessageRenderer;
