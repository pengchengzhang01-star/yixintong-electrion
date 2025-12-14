import { ConversationItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { useDrop } from "ahooks";
import { t } from "i18next";
import { useState } from "react";

import { message, modal } from "@/AntdGlobalComp";
import file_icon from "@/assets/images/messageItem/file_icon.png";
import { bytesToSize, canSendImageTypeList, getFileType } from "@/utils/common";

import { useFileMessage } from "./ChatFooter/SendActionBar/useFileMessage";
import { useSendMessage } from "./ChatFooter/useSendMessage";

export function useDropAndPaste({
  currentConversation,
  getIsCanSendMessage,
  insertImage,
}: {
  currentConversation?: ConversationItem;
  getIsCanSendMessage: () => boolean;
  insertImage: (attributes: Record<string, string>) => void;
}) {
  const [droping, setDroping] = useState(false);
  const { createFileMessage } = useFileMessage();
  const { sendMessage } = useSendMessage();

  const dropEnd = () => {
    if (!droping) return;
    setDroping(false);
  };

  useDrop(document.getElementById("chat-container"), {
    onText: () => {
      dropEnd();
    },
    onFiles: async (files, e) => {
      if (!getIsCanSendMessage()) return;
      await Promise.all(files.map(async (file) => await checkIsFile(file))).then(
        (results) => {
          files = files.filter((_, index) => results[index]);
        },
      );
      if (!files.length) {
        message.error(t("toast.fileTypeError"));
        dropEnd();
        return;
      }

      const imageFiles = [] as File[];
      const otherFiles = [] as File[];
      files.map((file) => {
        const isImage = canSendImageTypeList.includes(getFileType(file.name));
        if (isImage) {
          imageFiles.push(file);
        } else {
          otherFiles.push(file);
        }
      });
      if (imageFiles.length) {
        for await (const file of imageFiles) {
          const objUrl = URL.createObjectURL(file);
          insertImage({
            src: objUrl,
          });
        }
      }

      if (otherFiles.length) {
        modal.confirm({
          title: `${t("placeholder.sendTo")}${currentConversation?.showName}`,
          icon: null,
          width: 320,
          centered: true,
          className: "drop-file-moal",
          content: (
            <div className="h-[240px] overflow-y-auto border-b border-t border-[var(--gap-text)] p-2">
              {otherFiles.map((file) => (
                <div className="mb-2 flex items-center" key={file.lastModified}>
                  <img width={38} src={file_icon} alt="file" />
                  <div className="ml-3 overflow-hidden">
                    <div className="mb-1.5 truncate">{file.name}</div>
                    <div className="text-xs text-[var(--sub-text)]">
                      {bytesToSize(file.size)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ),
          okText: t("confirm"),
          cancelText: t("cancel"),
          onOk: () => {
            otherFiles.map(async (file) => {
              const message = await createFileMessage(file);
              sendMessage({
                message: message,
              });
            });
          },
        });
      }

      dropEnd();
    },
    onUri: (_, e) => {
      e?.preventDefault();
      dropEnd();
    },
    onDom: (_, e) => {
      e?.preventDefault();
      dropEnd();
    },
    onDragEnter: (e) => {
      if (e?.dataTransfer.types[0] === "custom") return;
      if (!getIsCanSendMessage()) return;
      setDroping(true);
    },
    onDragLeave: dropEnd,
  });

  return {
    droping,
  };
}

const checkIsFile = (file: File) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(true);
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
