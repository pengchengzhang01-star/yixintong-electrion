import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { MessageType } from "@openim/wasm-client-sdk";
import { Spin } from "antd";
import clsx from "clsx";
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { message as antdMessage } from "@/AntdGlobalComp";
import ChatInput from "@/components/ChatInput";
import { ChatInputRef } from "@/components/ChatInput/models/types";
import { type DeltaStatic, getPlainText } from "@/components/ChatInput/utils";
import Twemoji from "@/components/Twemoji";
import { useMention } from "@/hooks/useMention";
import { IMSDK } from "@/layout/MainContentWrap";
import { escapeHtml, feedbackToast, formatBr } from "@/utils/common";
import { deepClone } from "@/utils/deepClone";
import { formatAtText, formatLink, parseAtToModel } from "@/utils/imCommon";

import MentionListItem from "../ChatFooter/MentionListItem";
import { IMessageItemProps } from ".";
import styles from "./message-item.module.scss";

export type EditState = "preview" | "edit" | "updating";

const TextMessageRender: ForwardRefRenderFunction<
  { updateEditState: (state: EditState) => void },
  IMessageItemProps
> = ({ message, conversationID }, ref) => {
  const { t } = useTranslation();
  let content = message.textElem?.content || "";
  let editAtContent = "";

  if (message.contentType === MessageType.QuoteMessage) {
    content = message.quoteElem!.text;
  }
  content = escapeHtml(content);
  if (message.contentType === MessageType.AtTextMessage) {
    const atEl = {
      ...message.atTextElem!,
      text: escapeHtml(message.atTextElem!.text),
    };
    content = formatAtText(atEl);
    editAtContent = parseAtToModel(atEl);
  }

  content = formatLink(content);
  content = formatBr(content);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const [value, setValue] = useState("");
  const [editState, setEditState] = useState<EditState>("preview");

  const { getMentions, fetchMentionUsers } = useMention(wrapperRef);

  useImperativeHandle(
    ref,
    () => ({
      updateEditState: (state: EditState) => {
        if (state === "edit") {
          // ensure input component is mounted
          setTimeout(() => setValue(editAtContent || content));
        }
        setEditState(state);
      },
    }),
    [editAtContent, content],
  );
  const cancelEdit = () => {
    setEditState("preview");
  };

  const handleEdit = async () => {
    if (!value) {
      antdMessage.info(t("toast.contentEmpty"));
      return;
    }
    const transformedText = getPlainText(
      chatInputRef.current?.getEditor()?.getContents() as DeltaStatic,
    );
    const newMessage = deepClone(message);
    if (newMessage.contentType === MessageType.TextMessage) {
      newMessage.textElem!.content = transformedText;
    } else if (newMessage.contentType === MessageType.QuoteMessage) {
      newMessage.quoteElem!.text = transformedText;
    } else if (newMessage.contentType === MessageType.AtTextMessage) {
      const uniqueAtList = getMentions();
      newMessage.atTextElem!.text = transformedText;
      newMessage.atTextElem!.atUsersInfo = uniqueAtList.map((at) => ({
        atUserID: at.userID,
        groupNickname: at.nickname,
      }));
    }
    setEditState("updating");
    try {
      await IMSDK.modifyMessage({
        message: newMessage,
        conversationID: conversationID!,
      });
    } catch (error: any) {
      // 1001: ArgsError new content same as old content.
      // this mean text content not modified, it's normal situation, don't need to show toast
      if (error?.errCode === 1001) {
        console.error("modifyMessage", error);
      } else {
        feedbackToast({ error });
      }
    }
    setEditState("preview");
  };

  return editState === "preview" ? (
    <Twemoji dbSelectAll>
      <div
        className={styles.bubble}
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </Twemoji>
  ) : (
    <Spin spinning={editState === "updating"}>
      <div
        ref={wrapperRef}
        className={clsx(
          "min-w-[30vw] rounded-lg border border-gray-200 px-3 py-2",
          styles["edit-wrapper"],
        )}
      >
        <ChatInput
          ref={chatInputRef}
          value={value}
          showToolbar={false}
          onSend={handleEdit}
          onChange={(content) => setValue(content)}
          fetchMentionUsers={fetchMentionUsers}
          renderMentionItem={MentionListItem}
          onContextMenu={
            !window.electronAPI
              ? undefined
              : () => window.electronAPI?.showInputContextMenu()
          }
        />
        <div className="mt-1.5 flex justify-end space-x-3">
          <CloseOutlined
            className="cursor-pointer text-[#8e9ab0]"
            onClick={cancelEdit}
          />
          <CheckOutlined
            className="cursor-pointer text-[#8e9ab0]"
            onClick={handleEdit}
          />
        </div>
      </div>
    </Spin>
  );
};

export default forwardRef(TextMessageRender);
