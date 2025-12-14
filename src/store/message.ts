import { MessageStatus, MessageType } from "@openim/wasm-client-sdk";
import { MessageItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { create } from "zustand";

import { IMSDK } from "@/layout/MainContentWrap";
import {
  clearMessages,
  clearMessageState,
} from "@/pages/chat/queryChat/useHistoryMessageList";

import { useConversationStore } from "./conversation";
import { DownloadData, MessageStore } from "./type";
import { useUserStore } from "./user";

export interface ExType {
  checked?: boolean;
  isAppend?: boolean;
  gapTime?: boolean;
  jump?: boolean;
  errCode?: number;
}

export type ExMessageItem = MessageItem & ExType;

export const useMessageStore = create<MessageStore>()((set, get) => ({
  previewImgList: [],
  isCheckMode: false,
  jumpClientMsgID: undefined,
  downloadMap: {},
  updateMessagePreview: (message: ExMessageItem) => {
    // update download state
    const tmpPreviewList = [...get().previewImgList];
    const previewIdx = tmpPreviewList.findIndex(
      (item) => item.clientMsgID === message.clientMsgID,
    );
    if (previewIdx > -1) {
      const field = tmpPreviewList[previewIdx].videoUrl ? "videoUrl" : "url";
      tmpPreviewList[previewIdx][field] = `file://${message.localEx}`;
      set(() => ({ previewImgList: tmpPreviewList }));
    }
  },
  clearPreviewList: () => {
    clearMessages();
    set(() => ({ previewImgList: [], hasMore: false }));
  },
  updateCheckMode: (isCheckMode: boolean) => {
    if (!isCheckMode) {
      clearMessageState("checked");
    }
    set(() => ({ isCheckMode }));
  },
  updateJumpClientMsgID: (clientMsgID?: string) => {
    set(() => ({ jumpClientMsgID: clientMsgID }));
  },
  getConversationPreviewImgList: async () => {
    const conversationID =
      useConversationStore.getState().currentConversation?.conversationID;

    if (!conversationID) return;
    const {
      data: { searchResultItems },
    } = await IMSDK.searchLocalMessages({
      conversationID,
      keywordList: [],
      keywordListMatchType: 0,
      senderUserIDList: [],
      messageTypeList: [MessageType.PictureMessage, MessageType.VideoMessage],
      searchTimePosition: 0,
      searchTimePeriod: 0,
      pageIndex: 1,
      count: 200,
    });
    if (!searchResultItems?.[0].messageCount) return;
    console.log(searchResultItems[0].messageList);
    const newPreviewImgList = searchResultItems[0].messageList
      .filter((message) => message.status === MessageStatus.Succeed)
      .map((item) => ({
        url: getImageMessageSourceUrl(item) ?? "",
        clientMsgID: item.clientMsgID,
        videoUrl: getVideoMessageSourceUrl(item),
        thumbUrl: item.pictureElem?.snapshotPicture?.url ?? "",
      }));
    set(() => ({ previewImgList: [...newPreviewImgList] }));
  },
  tryAddPreviewImg: (mesageList: ExMessageItem[]) => {
    const previews = mesageList
      .filter((message) => MediaMessageTypes.includes(message.contentType))
      .map((message) => ({
        url: getImageMessageSourceUrl(message) ?? "",
        clientMsgID: message.clientMsgID,
        videoUrl: getVideoMessageSourceUrl(message),
        thumbUrl: message.pictureElem?.snapshotPicture.url ?? "",
      }));
    if (previews.length === 0) return;
    set((state) => ({
      previewImgList: [...previews, ...state.previewImgList],
    }));
  },
  addDownloadTask: (url: string, data: DownloadData) => {
    set((state) => ({
      downloadMap: { ...state.downloadMap, [url]: { ...data } },
    }));
  },
  updateDownloadTask: (url: string, data: DownloadData) => {
    const tmpMap = { ...get().downloadMap };
    tmpMap[url] = {
      ...tmpMap[url],
      ...data,
    };
    set(() => ({ downloadMap: tmpMap }));
  },
  removeDownloadTask: (url: string) => {
    const tmpMap = { ...get().downloadMap };
    if (!tmpMap[url]) return;
    delete tmpMap[url];
    set(() => ({ downloadMap: tmpMap }));
  },
}));

const MediaMessageTypes = [MessageType.PictureMessage, MessageType.VideoMessage];

export const getImageMessageSourceUrl = (message: ExMessageItem) => {
  if (message.contentType === MessageType.VideoMessage) {
    const snapshotPath = message.videoElem!.snapshotPath;
    if (snapshotPath && window.electronAPI?.fileExists(snapshotPath)) {
      return `file://${snapshotPath}`;
    }
    const snapshotUrl = message.videoElem!.snapshotUrl;
    const cachePath = useUserStore.getState().imageCache[snapshotUrl];
    if (cachePath && window.electronAPI?.fileExists(cachePath)) {
      return `file://${cachePath}`;
    }
    return snapshotUrl;
  }

  if (message.localEx && window.electronAPI?.fileExists(message.localEx)) {
    return `file://${message.localEx}`;
  }
  if (window.electronAPI?.fileExists(message.pictureElem!.sourcePath)) {
    return `file://${message.pictureElem!.sourcePath}`;
  }
  return message.pictureElem!.sourcePicture.url;
};

export const getVideoMessageSourceUrl = (message: ExMessageItem) => {
  if (message.contentType !== MessageType.VideoMessage) return undefined;
  if (message.localEx && window.electronAPI?.fileExists(message.localEx)) {
    return `file://${message.localEx}`;
  }
  if (window.electronAPI?.fileExists(message.videoElem!.videoPath)) {
    return `file://${message.videoElem!.videoPath}`;
  }
  return message.videoElem!.videoUrl;
};
