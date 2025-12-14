import { CheckOutlined, CloseCircleFilled, DownOutlined } from "@ant-design/icons";
import { GroupMemberItem, MessageItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { useDebounceFn, useLatest, useThrottleFn } from "ahooks";
import { Dropdown, Image } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import cricle_cancel from "@/assets/images/chatFooter/cricle_cancel.png";
import file_icon from "@/assets/images/messageItem/file_icon.png";
import ChatInput from "@/components/ChatInput";
import { ChatInputRef } from "@/components/ChatInput/models/types";
import {
  type DeltaStatic,
  getPlainText,
  getPlainTextWithMentionElem,
} from "@/components/ChatInput/utils";
import Twemoji from "@/components/Twemoji";
import { useMention } from "@/hooks/useMention";
import i18n from "@/i18n";
import { IMSDK } from "@/layout/MainContentWrap";
import { useCommonModal } from "@/pages/common";
import { useConversationStore } from "@/store";
import FileDownloadIcon from "@/svg/FileDownloadIcon";
import { base64toFile, bytesToSize, escapeHtml } from "@/utils/common";
import emitter from "@/utils/events";
import { formatMessageByType, parseAtToModel, parseBr } from "@/utils/imCommon";
import { getSendAction, setSendAction as saveSendAction } from "@/utils/storage";

import MentionListItem from "./MentionListItem";
import SendActionBar from "./SendActionBar";
import { FileWithPath, useFileMessage } from "./SendActionBar/useFileMessage";
import { useDropDomOnly } from "./useDropDomOnly";
import { useSendMessage } from "./useSendMessage";

export type ChatFooterHandle = {
  insertImage: (attributes: Record<string, string>) => void;
};

export type DraftMap = {
  text?: string;
  quote?: MessageItem;
};

type PreviewFile = {
  id: string;
  type: "image" | "video" | "file";
  file: FileWithPath;
  snapshotFile?: FileWithPath;
};

const sendActions = [
  { label: t("placeholder.sendWithEnter"), key: "enter" },
  { label: t("placeholder.sendWithShiftEnter"), key: "shift-enter" },
];

i18n.on("languageChanged", () => {
  sendActions[0].label = t("placeholder.sendWithEnter");
  sendActions[1].label = t("placeholder.sendWithShiftEnter");
});

const ChatFooter: ForwardRefRenderFunction<
  ChatFooterHandle,
  { agent?: API.Agent.Agent }
> = ({ agent }, ref) => {
  const [html, setHtml] = useState("");
  const { conversationID } = useParams();
  const [sendAction, setSendAction] = useState(getSendAction());
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);

  const editorWrapRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  const quoteMessage = useConversationStore((state) => state.quoteMessage);
  const latestQuoteMessage = useLatest(quoteMessage);
  const updateQuoteMessage = useConversationStore((state) => state.updateQuoteMessage);

  const { createFileMessage, getVideoSnshotFile } = useFileMessage();
  const { sendMessage } = useSendMessage();

  const { getMentions, fetchMentionUsers } = useMention(editorWrapRef);
  useDropDomOnly({ domRef: editorWrapRef, sendMessage });

  const drft = useRef("");

  useEffect(() => {
    const dispose = window.electronCapturer?.onCaptureResult(({ dataUrl }) => {
      chatInputRef.current?.focus();
      const file = base64toFile(dataUrl);
      onPasteFileUpload(file);
      chatInputRef.current?.focus();
    });
    return () => {
      dispose?.();
    };
  }, []);

  useEffect(() => {
    window.editRevoke = (clientMsgID: string) => {
      // eslint-disable-next-line
      let { quoteMessage, text, atEl } =
        useConversationStore.getState().revokeMap[clientMsgID];
      updateQuoteMessage(quoteMessage);
      if (atEl) {
        text = parseAtToModel({
          ...atEl,
          text: escapeHtml(atEl.text),
        });
      }
      setHtml(parseBr(escapeHtml(text)));
      drft.current = text;
      setTimeout(() => chatInputRef.current?.focus());
    };
    const atHandler = (atUser: GroupMemberItem) => {
      const atEls = getMentions();
      if (atEls.length > 9) return;
      chatInputRef.current?.insertMention({
        ...atUser,
        id: atUser.userID,
        value: atUser.nickname,
      });
    };
    emitter.on("TRIGGER_GROUP_AT", atHandler);
    return () => {
      emitter.off("TRIGGER_GROUP_AT", atHandler);
    };
  }, []);

  useEffect(() => {
    if (quoteMessage) {
      chatInputRef.current?.focus();
    }
  }, [quoteMessage]);

  useEffect(() => {
    const oldDraftText = useConversationStore.getState().currentConversation?.draftText;
    let oldDraftMap: DraftMap = {};
    if (oldDraftText) {
      try {
        oldDraftMap = JSON.parse(oldDraftText);
      } catch (error) {
        console.error("parse oldDraftText error");
      }
    }
    checkSavedDraft(oldDraftMap);
    setTimeout(() => chatInputRef.current?.focus());

    return () => {
      const editor = chatInputRef.current?.getEditor();
      checkDraftSave(editor?.getContents());
      changeInputState(false);
      setPreviewFiles([]);
    };
  }, [conversationID]);

  const checkSavedDraft = (oldDraftMap: DraftMap) => {
    setHtml(escapeHtml(oldDraftMap.text ?? ""));
    drft.current = oldDraftMap.text ?? "";
    if (oldDraftMap.quote) {
      updateQuoteMessage(oldDraftMap.quote);
    }
  };

  const checkDraftSave = (delta?: DeltaStatic) => {
    if (!delta) return;
    const cleanText = getPlainTextWithMentionElem(delta);

    const newDraftMap: DraftMap = {};
    if (cleanText) {
      newDraftMap.text = cleanText;
    }
    if (latestQuoteMessage.current) {
      newDraftMap.quote = latestQuoteMessage.current;
    }

    if (!conversationID) return;
    let draftText;
    if (!Object.keys(newDraftMap).length) {
      draftText = "";
    } else {
      draftText = JSON.stringify(newDraftMap);
    }

    IMSDK.setConversationDraft({
      conversationID,
      draftText,
    });
  };

  const changeInputState = (focus: boolean) => {
    const conversationID =
      useConversationStore.getState().currentConversation?.conversationID;
    if (!conversationID) return;
    IMSDK.changeInputStates({
      conversationID,
      focus,
    });
  };

  const { run: throttleTyping } = useThrottleFn(changeInputState, { wait: 1500 });
  const { run: debounceTyping } = useDebounceFn(changeInputState, { wait: 1500 });

  const onChange = (value: string) => {
    setHtml(value);
    drft.current = value;
    if (!useConversationStore.getState().currentConversation?.userID) return;

    if (value) {
      throttleTyping(true);
    }
    debounceTyping(false);
  };

  const sendPreviewFiles = () => {
    if (previewFiles.length === 0) return;

    previewFiles.map(async (item) => {
      const message = await createFileMessage(item.file);
      sendMessage({ message });
    });
    setPreviewFiles([]);
  };

  const getTextMessage = async (cleanText: string) => {
    const atEls = getMentions();

    if (
      useConversationStore.getState().currentConversation?.groupID &&
      atEls.length > 0
    ) {
      return (
        await IMSDK.createTextAtMessage({
          text: cleanText,
          atUserIDList: atEls.map((at) => at.userID),
          atUsersInfo: atEls.map((at) => ({
            atUserID: at.userID,
            groupNickname: at.nickname,
          })),
          message: latestQuoteMessage.current,
        })
      ).data;
    }
    if (latestQuoteMessage.current) {
      return (
        await IMSDK.createQuoteMessage({
          text: cleanText,
          message: JSON.stringify(latestQuoteMessage.current),
        })
      ).data;
    }
    return (await IMSDK.createTextMessage(cleanText)).data;
  };

  const enterToSend = async () => {
    const editor = chatInputRef.current?.getEditor();
    const cleanText = getPlainText(editor!.getContents());
    sendPreviewFiles();
    const message = await getTextMessage(cleanText);
    setHtml("");
    drft.current = "";
    if (!cleanText) return;

    sendMessage({ message });
    if (latestQuoteMessage.current) {
      updateQuoteMessage();
    }
  };

  const sendEmoji = (unicode: string) => chatInputRef.current?.insertEmoji(unicode);

  const onPasteFileUpload = async (file: FileWithPath) => {
    if (file.type.startsWith("image/")) {
      if (file.path) {
        file.url = `file://${file.path}`;
      } else {
        file.url = URL.createObjectURL(file);
      }
      setPreviewFiles((prev) => [
        ...prev,
        {
          id: uuidv4(),
          type: "image",
          file,
        },
      ]);
      return file.url;
    } else if (file.type.startsWith("video/")) {
      if (file.path) {
        file.url = `file://${file.path}`;
      } else {
        file.url = URL.createObjectURL(file);
      }
      const snapshotFile = await getVideoSnshotFile(file);
      snapshotFile.url = URL.createObjectURL(snapshotFile);
      setPreviewFiles((prev) => [
        ...prev,
        {
          id: uuidv4(),
          type: "video",
          file,
          snapshotFile,
        },
      ]);
      return snapshotFile.url;
    }
    setPreviewFiles((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type: "file",
        file,
      },
    ]);
  };

  const onFileRemove = useCallback((id: string) => {
    setPreviewFiles((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const cancelQuote = () => {
    updateQuoteMessage();
    chatInputRef.current?.focus();
  };

  const updateSendAction = (action: string) => {
    // eslint-disable-next-line
    setSendAction(action as any);
    saveSendAction(action);
  };

  useImperativeHandle(
    ref,
    () => ({
      insertImage: (attributes) => {
        console.log(attributes);
      },
    }),
    [],
  );

  return (
    <footer className="h-full bg-white py-px">
      <div className="flex h-full flex-col border-t border-t-[var(--gap-text)]">
        <SendActionBar
          sendEmoji={sendEmoji}
          sendMessage={sendMessage}
          createFileMessage={createFileMessage}
        />
        <div
          ref={editorWrapRef}
          id="editor-wrap"
          className="relative flex flex-1 flex-col"
        >
          {quoteMessage && (
            <div className="mx-5.5 mt-3 flex w-fit items-start rounded-md bg-[var(--chat-bubble)] px-2.5 py-2">
              <img
                className="mt-px cursor-pointer"
                width={13}
                src={cricle_cancel}
                alt="cancel"
                onClick={cancelQuote}
              />
              <Twemoji>
                <div
                  className="ml-1.5 line-clamp-1 break-all text-xs text-[var(--sub-text)]"
                  title=""
                >{`${t("placeholder.reply")}${
                  quoteMessage.senderNickname
                }：${formatMessageByType(quoteMessage)}`}</div>
              </Twemoji>
            </div>
          )}
          <ChatInput
            className={clsx(
              "absolute inset-0 bottom-12",
              Boolean(quoteMessage) && "top-9",
            )}
            ref={chatInputRef}
            value={html}
            showToolbar={false}
            sendKeyBehavior={sendAction}
            onSend={enterToSend}
            onChange={onChange}
            fetchMentionUsers={fetchMentionUsers}
            renderMentionItem={MentionListItem}
            onDeleteWithEmpty={cancelQuote}
            onPasteImageUpload={onPasteFileUpload as any}
            onPasteFileUpload={onPasteFileUpload as any}
            onContextMenu={
              !window.electronAPI
                ? undefined
                : () => window.electronAPI?.showInputContextMenu()
            }
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 py-1">
            <FilePreviewList files={previewFiles} onFileRemove={onFileRemove} />
            <Dropdown.Button
              overlayClassName="send-action-dropdown"
              className="w-fit px-6 py-1"
              type="primary"
              icon={<DownOutlined />}
              menu={{
                items: sendActions.map((item) => ({
                  label: item.label,
                  key: item.key,
                  itemIcon: sendAction === item.key ? <CheckOutlined /> : undefined,
                  onClick: () => updateSendAction(item.key),
                })),
              }}
              onClick={enterToSend}
            >
              {t("placeholder.send")}
            </Dropdown.Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default memo(forwardRef(ChatFooter));

const FilePreviewList = memo(
  ({
    files,
    onFileRemove,
  }: {
    files: PreviewFile[];
    onFileRemove: (id: string) => void;
  }) => {
    const { showVideoPlayer } = useCommonModal();

    return (
      <div className="file-preview-list flex flex-1 items-center gap-1.5 overflow-x-auto py-1">
        {files.map((item) => {
          if (item.type === "image") {
            return (
              <div
                key={item.id}
                className="relative h-16 w-16 flex-none overflow-hidden rounded-lg "
              >
                <CloseCircleFilled
                  className="absolute right-1.5 top-1 z-10 cursor-pointer text-[#acacb1]"
                  onClick={() => onFileRemove(item.id)}
                />
                <Image
                  src={item.file.url || item.file.path}
                  className="object-contain"
                />
              </div>
            );
          }
          if (item.type === "video") {
            return (
              <div
                key={item.id}
                className="relative  h-16 w-16 flex-none overflow-hidden rounded-lg"
              >
                <CloseCircleFilled
                  className="absolute right-1.5 top-1 z-10 cursor-pointer text-[#acacb1]"
                  onClick={() => onFileRemove(item.id)}
                />
                <Image
                  preview={false}
                  className="cursor-pointer object-cover"
                  src={item.snapshotFile?.url || item.snapshotFile?.path}
                  onClick={() => showVideoPlayer(item.file.url || item.file.path)}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer">
                  <FileDownloadIcon size={24} pausing={false} finished percent={0} />
                </div>
              </div>
            );
          }
          return (
            <div
              key={item.id}
              className="relative flex flex-none gap-2 rounded-xl border border-[var(--gap-text)] px-4 py-[9px]"
            >
              <CloseCircleFilled
                className="absolute right-1.5 top-1 z-10 cursor-pointer text-[#acacb1]"
                onClick={() => onFileRemove(item.id)}
              />
              <img width={38} src={file_icon} alt="file" />
              <div>
                <div className="max-w-24 truncate">{item.file.name}</div>
                <div className="text-xs text-[var(--sub-text)]">
                  {bytesToSize(item.file.size)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
