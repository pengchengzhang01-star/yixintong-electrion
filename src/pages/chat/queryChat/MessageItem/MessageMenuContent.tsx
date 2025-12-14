import { MessageStatus, MessageType } from "@openim/wasm-client-sdk";
import i18n, { t } from "i18next";
import { memo, useEffect, useRef } from "react";
import { useCopyToClipboard } from "react-use";

import { modal } from "@/AntdGlobalComp";
import { addCollectRecord } from "@/api/collect";
import check from "@/assets/images/messageMenu/check.png";
import collect from "@/assets/images/messageMenu/collect.png";
import copy from "@/assets/images/messageMenu/copy.png";
import emoji from "@/assets/images/messageMenu/emoji.png";
import finder from "@/assets/images/messageMenu/finder.png";
import forward from "@/assets/images/messageMenu/forward.png";
import pin from "@/assets/images/messageMenu/pin.png";
import remove from "@/assets/images/messageMenu/remove.png";
import reply from "@/assets/images/messageMenu/reply.png";
import revoke from "@/assets/images/messageMenu/revoke.png";
import { useCheckConfirmModal } from "@/hooks/useCheckConfirmModal";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import { getSourceData } from "@/hooks/useMessageFileDownloadState";
import { IMSDK } from "@/layout/MainContentWrap";
import {
  ExMessageItem,
  getImageMessageSourceUrl,
  useConversationStore,
  useMessageStore,
  useUserStore,
} from "@/store";
import { useCustomEmojiStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import { emit } from "@/utils/events";
import { formatAtText, isGroupSession } from "@/utils/imCommon";

import { deleteOneMessage, updateOneMessage } from "../useHistoryMessageList";

enum MessageMenuType {
  AddPhiz,
  Forward,
  Collect,
  Copy,
  Edit,
  Check,
  Reply,
  Revoke,
  Delete,
  Finder,
  Pin,
}

const messageMenuList = [
  {
    idx: MessageMenuType.AddPhiz,
    title: t("placeholder.add"),
    icon: emoji,
    hidden: false,
  },
  {
    idx: MessageMenuType.Forward,
    title: t("placeholder.forward"),
    icon: forward,
    hidden: false,
  },
  {
    idx: MessageMenuType.Collect,
    title: t("placeholder.collect"),
    icon: collect,
    hidden: false,
  },
  {
    idx: MessageMenuType.Copy,
    title: t("placeholder.copy"),
    icon: copy,
    hidden: false,
  },
  {
    idx: MessageMenuType.Edit,
    title: t("placeholder.edit"),
    icon: copy,
    hidden: false,
  },
  {
    idx: MessageMenuType.Check,
    title: t("placeholder.check"),
    icon: check,
    hidden: false,
  },
  {
    idx: MessageMenuType.Reply,
    title: t("placeholder.reply"),
    icon: reply,
    hidden: false,
  },
  {
    idx: MessageMenuType.Revoke,
    title: t("placeholder.revoke"),
    icon: revoke,
    hidden: false,
  },
  {
    idx: MessageMenuType.Delete,
    title: t("placeholder.delete"),
    icon: remove,
    hidden: false,
  },
  {
    idx: MessageMenuType.Finder,
    title: t("placeholder.finder"),
    icon: finder,
    hidden: false,
  },
  {
    idx: MessageMenuType.Pin,
    title: t("placeholder.pin"),
    icon: pin,
    hidden: false,
  },
];

i18n.on("languageChanged", () => {
  messageMenuList[0].title = t("placeholder.add");
  messageMenuList[1].title = t("placeholder.forward");
  messageMenuList[2].title = t("placeholder.collect");
  messageMenuList[3].title = t("placeholder.copy");
  messageMenuList[4].title = t("placeholder.edit");
  messageMenuList[5].title = t("placeholder.check");
  messageMenuList[6].title = t("placeholder.reply");
  messageMenuList[7].title = t("placeholder.revoke");
  messageMenuList[8].title = t("placeholder.delete");
  messageMenuList[9].title = t("placeholder.finder");
  messageMenuList[10].title = t("placeholder.pin");
});

const canPinTypes = [MessageType.TextMessage, MessageType.AtTextMessage];
const canCollectTypes = [
  MessageType.TextMessage,
  MessageType.AtTextMessage,
  MessageType.QuoteMessage,
  MessageType.PictureMessage,
  MessageType.VideoMessage,
  MessageType.FileMessage,
  MessageType.VoiceMessage,
  MessageType.CardMessage,
];
const canCopyTypes = [
  MessageType.TextMessage,
  MessageType.QuoteMessage,
  MessageType.AtTextMessage,
  MessageType.PictureMessage,
];
const canEditTypes = [
  MessageType.TextMessage,
  MessageType.QuoteMessage,
  MessageType.AtTextMessage,
];
const canAddPhizTypes = [MessageType.PictureMessage, MessageType.FaceMessage];
const canDownloadTypes = [
  MessageType.PictureMessage,
  MessageType.VideoMessage,
  MessageType.FileMessage,
];

const MessageMenuContent = ({
  message,
  conversationID,
  closeMenu,
  editMessage,
}: {
  message: ExMessageItem;
  conversationID: string;
  closeMenu: () => void;
  editMessage?: () => void;
}) => {
  const copying = useRef(false);
  const selfUserID = useUserStore((state) => state.selfInfo.userID);
  const ownerUserID = useConversationStore(
    (state) => state.currentGroupInfo?.ownerUserID,
  );
  const updateCheckMode = useMessageStore((state) => state.updateCheckMode);
  const updateQuoteMessage = useConversationStore((state) => state.updateQuoteMessage);
  const addRevokedMessage = useConversationStore((state) => state.addRevokedMessage);
  const addPinnedMessage = useConversationStore((state) => state.addPinnedMessage);

  const [_, copyToClipboard] = useCopyToClipboard();
  const { isNomal, isAdmin, isOwner } = useCurrentMemberRole();

  const { showCheckConfirmModal } = useCheckConfirmModal();

  const getCustomEmojiData = async () => {
    let sourceData = {
      path: "",
      url: "",
      width: 0,
      height: 0,
    };
    if (message.contentType === MessageType.PictureMessage) {
      sourceData = {
        path: message.pictureElem!.sourcePath,
        url: message.pictureElem!.sourcePicture.url,
        width: message.pictureElem!.sourcePicture.width,
        height: message.pictureElem!.sourcePicture.height,
      };
    }
    if (message.contentType === MessageType.FaceMessage) {
      const faceEl = JSON.parse(message.faceElem!.data);
      sourceData = {
        path: faceEl.path ?? "",
        url: faceEl.url,
        width: faceEl.width,
        height: faceEl.height,
      };
    }
    if (window.electronAPI?.fileExists(sourceData.path)) {
      return sourceData;
    }
    if (message.localEx && window.electronAPI?.fileExists(message.localEx)) {
      sourceData.path = message.localEx;
      return sourceData;
    }

    const blob = await fetch(sourceData.url).then((response) => response.blob());
    const file = new File([blob], getFileNameFromUrl(sourceData.url), {
      type: blob.type,
    });
    sourceData.path =
      (await window.electronAPI?.saveFileToDisk({
        file,
        type: "fileCache",
        sync: true,
      })) ?? "";
    return sourceData;
  };

  const getFileNameFromUrl = (url: string) => {
    const idx = url.lastIndexOf("/");
    return url.slice(idx + 1);
  };

  const customEmojis = useCustomEmojiStore((state) => state.customEmojis);
  const addCustomEmoji = useCustomEmojiStore((state) => state.addCustomEmoji);
  const refreshCustomEmojis = useCustomEmojiStore((state) => state.refreshCustomEmojis);

  const menuClick = (idx: MessageMenuType) => {
    switch (idx) {
      case MessageMenuType.AddPhiz:
        handleAddCustomEmoji();
        break;
      case MessageMenuType.Forward:
        emit("OPEN_CHOOSE_MODAL", {
          type: "FORWARD_MESSAGE",
          extraData: message,
        });
        break;
      case MessageMenuType.Collect:
        addCollectRecord(message.clientMsgID, JSON.stringify(message))
          .then(() => feedbackToast({ msg: t("toast.addSuccess") }))
          .catch((error) => {
            // 1003: duplicate collect
            error.errCode === 1003
              ? feedbackToast({ msg: t("toast.alreadyCollected") })
              : feedbackToast({ error });
          });
        break;
      case MessageMenuType.Copy:
        if (message.contentType === MessageType.PictureMessage) {
          copyImage();
        } else {
          copyToClipboard(getCopyText().trim());
          feedbackToast({ msg: t("toast.copySuccess") });
        }
        break;
      case MessageMenuType.Edit:
        editMessage?.();
        break;
      case MessageMenuType.Check:
        updateOneMessage({
          ...message,
          checked: true,
        } as ExMessageItem);
        updateCheckMode(true);
        break;
      case MessageMenuType.Reply:
        updateQuoteMessage(message);
        break;
      case MessageMenuType.Revoke:
        modal.confirm({
          title: t("toast.revokeMessage"),
          content: t("toast.revokeConfirm"),
          onOk: tryRevoke,
        });
        break;
      case MessageMenuType.Delete:
        showCheckConfirmModal({
          title: t("toast.deleteMessage"),
          confirmTip: t(isSender ? "toast.mutualDelete" : "toast.deleteConfirm"),
          description: isSender ? t("toast.deleteDescription") : undefined,
          showCheckbox: isSender,
          onOk: tryRemove,
        });
        break;
      case MessageMenuType.Finder:
        window.electronAPI?.showInFinder(
          message.localEx || getSourceData(message).path,
        );
        break;
      case MessageMenuType.Pin:
        addPinnedMessage(conversationID, message).catch((error) => {
          feedbackToast({ error });
        });
        break;
      default:
        break;
    }
    closeMenu();
  };

  useEffect(() => {
    refreshCustomEmojis();
  }, [refreshCustomEmojis]);

  const handleAddCustomEmoji = async () => {
    try {
      const customEmojiData = await getCustomEmojiData();
      const found = customEmojis.find((item) => item.url === customEmojiData.url);
      if (found) {
        feedbackToast({ msg: t("toast.customEmojiAlreadyAdded") });
        return;
      }
      await addCustomEmoji(customEmojiData);
      feedbackToast({ msg: t("toast.addSuccess") });
    } catch (error) {
      console.error("Failed to add custom emoji:", error);
      feedbackToast({ msg: t("toast.addFailed"), error });
    }
  };

  const copyImage = async () => {
    let error;
    if (copying.current) return;
    copying.current = true;
    try {
      const sourceUrl = getImageMessageSourceUrl(message);
      let blob = await fetch(sourceUrl).then((response) => response.blob());
      if (blob.type !== "image/png") {
        blob = await convertToPng(blob);
      }

      await navigator.clipboard.write([
        new window.ClipboardItem({
          "image/png": blob,
        }),
      ]);
    } catch (err) {
      error = err;
      console.error(error);
    }
    feedbackToast({
      error,
      msg: error ? t("toast.copyFailed") : t("toast.copySuccess"),
    });
    copying.current = false;
  };

  const tryRevoke = async () => {
    try {
      await IMSDK.revokeMessage({ conversationID, clientMsgID: message.clientMsgID });
      updateOneMessage({
        ...message,
        contentType: MessageType.RevokeMessage,
        notificationElem: {
          detail: JSON.stringify({
            clientMsgID: message.clientMsgID,
            revokeTime: Date.now(),
            revokerID: selfUserID,
            revokerNickname: t("you"),
            revokerRole: 0,
            seq: message.seq,
            sessionType: message.sessionType,
            sourceMessageSendID: message.sendID,
            sourceMessageSendTime: message.sendTime,
            sourceMessageSenderNickname: message.senderNickname,
          }),
        },
      });
      if (
        canCopyTypes.slice(0, 3).includes(message.contentType) &&
        message.sendID === selfUserID
      ) {
        addRevokedMessage(
          { ...message },
          message.atTextElem?.quoteMessage ?? message.quoteElem?.quoteMessage,
        );
      }
    } catch (error) {
      feedbackToast({ error });
    }
  };

  const tryRemove = async (mutual: boolean) => {
    try {
      if (message.status === MessageStatus.Failed) {
        await IMSDK.deleteMessageFromLocalStorage({
          clientMsgID: message.clientMsgID,
          conversationID,
        });
      } else {
        await IMSDK.deleteMessages({
          clientMsgIDs: [message.clientMsgID],
          conversationID,
          isSync: mutual,
        });
      }
      deleteOneMessage(message.clientMsgID);
    } catch (error) {
      feedbackToast({ error });
    }
  };

  const getCopyText = () => {
    const selection = window.getSelection()?.toString();

    if (message.contentType === MessageType.AtTextMessage) {
      return formatAtText(
        { ...message.atTextElem!, text: selection || message.atTextElem!.text },
        true,
      );
    }
    return selection || message.quoteElem?.text || message.textElem?.content || "";
  };

  const senderIsOwner = message.sendID === ownerUserID;
  const isSender = message.sendID === selfUserID;
  const moreThanRevokeLimit = message.sendTime < Date.now() - 5 * 60 * 1000;
  const messageIsSuccess = message.status === MessageStatus.Succeed;
  const isPrivateChat = message.attachedInfoElem?.isPrivateChat;
  const privateCanShow = [
    MessageMenuType.AddPhiz,
    MessageMenuType.Copy,
    MessageMenuType.Check,
    MessageMenuType.Delete,
  ];

  return (
    <div className="app-no-drag p-1">
      {messageMenuList.map((menu) => {
        if (
          menu.idx === MessageMenuType.AddPhiz &&
          !canAddPhizTypes.includes(message.contentType)
        ) {
          return null;
        }

        if (
          menu.idx === MessageMenuType.Copy &&
          !canCopyTypes.includes(message.contentType)
        ) {
          return null;
        }

        if (
          menu.idx === MessageMenuType.Edit &&
          (!isSender || !canEditTypes.includes(message.contentType))
        ) {
          return null;
        }

        if (
          (menu.idx === MessageMenuType.Reply || menu.idx === MessageMenuType.Revoke) &&
          (!messageIsSuccess || message.contentType === MessageType.CustomMessage)
        ) {
          return null;
        }

        if (menu.idx === MessageMenuType.Revoke) {
          const isGroup = isGroupSession(message.sessionType);
          if (moreThanRevokeLimit && (!isGroup || (isGroup && isNomal))) return null;

          if (!isSender && !isGroup) return null;

          if (isGroup) {
            if ((isAdmin && senderIsOwner) || (isNomal && !isSender)) {
              return null;
            }
          }
        }

        if (isPrivateChat && !privateCanShow.includes(menu.idx)) {
          return null;
        }

        if (menu.idx === MessageMenuType.Finder) {
          if (!canDownloadTypes.includes(message.contentType) || !window.electronAPI) {
            return null;
          }
          const sourceUrl = message.localEx || getSourceData(message).path;
          if (!sourceUrl || !window.electronAPI?.fileExists(sourceUrl)) {
            return null;
          }
        }

        if (menu.idx === MessageMenuType.Pin) {
          if (
            !isGroupSession(message.sessionType) ||
            !(isAdmin || isOwner) ||
            !canPinTypes.includes(message.contentType)
          ) {
            return null;
          }
        }

        if (
          menu.idx === MessageMenuType.Collect &&
          !canCollectTypes.includes(message.contentType)
        ) {
          return null;
        }
        return (
          <div
            className="flex cursor-pointer items-center rounded px-3 py-2 hover:bg-[var(--primary-active)]"
            key={menu.idx}
            onClick={() => menuClick(menu.idx)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <img className="mr-2 h-3.5" width={14} src={menu.icon} alt={menu.title} />
            <div className="text-xs">{menu.title}</div>
          </div>
        );
      })}
    </div>
  );
};

export default memo(MessageMenuContent);

async function convertToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((pngBlob) => {
        resolve(pngBlob!);
      }, "image/png");
    };

    img.onerror = reject;

    img.src = URL.createObjectURL(blob);
  });
}
