import { MessageType } from "@openim/wasm-client-sdk";
import {
  ConversationItem,
  GroupItem,
  GroupMemberItem,
  MessageItem,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { t } from "i18next";
import { create } from "zustand";

import { parseTwemoji } from "@/components/Twemoji";
import { IMSDK } from "@/layout/MainContentWrap";
import { FileWithPath } from "@/pages/chat/queryChat/ChatFooter/SendActionBar/useFileMessage";
import { feedbackToast } from "@/utils/common";
import { conversationSort, isGroupSession } from "@/utils/imCommon";

import { useMessageStore } from "./message";
import {
  ConversationListUpdateType,
  ConversationStore,
  RevokeMessageData,
} from "./type";
import { useUserStore } from "./user";

const CONVERSATION_SPLIT_COUNT = 50;

let currentToggleConversationId = 0;

export const useConversationStore = create<ConversationStore>()((set, get) => ({
  conversationIniting: true,
  conversationList: [],
  pinnedMessages: [],
  currentConversation: undefined,
  unReadCount: 0,
  currentGroupInfo: undefined,
  currentMemberInGroup: undefined,
  quoteMessage: undefined,
  revokeMap: {} as Record<string, RevokeMessageData>,
  fileMap: {} as Record<string, FileWithPath>,
  getConversationListByReq: async (isOffset?: boolean, forceLoading?: boolean) => {
    if (!forceLoading && !isOffset) set(() => ({ conversationIniting: true }));

    let tmpConversationList = [] as ConversationItem[];
    try {
      const { data } = await IMSDK.getConversationListSplit({
        offset: isOffset ? get().conversationList.length : 0,
        count: CONVERSATION_SPLIT_COUNT,
      });
      tmpConversationList = data;
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getConversationFailed") });
      if (!isOffset) set(() => ({ conversationIniting: false }));
      return true;
    }
    set((state) => ({
      conversationList: [
        ...(isOffset ? state.conversationList : []),
        ...tmpConversationList,
      ],
    }));
    if (!forceLoading && !isOffset) set(() => ({ conversationIniting: false }));
    return tmpConversationList.length === CONVERSATION_SPLIT_COUNT;
  },
  updateConversationList: (
    list: ConversationItem[],
    type: ConversationListUpdateType,
  ) => {
    const idx = list.findIndex(
      (c) => c.conversationID === get().currentConversation?.conversationID,
    );
    if (idx > -1) get().updateCurrentConversation(list[idx]);

    if (type === "filter") {
      set((state) => ({
        conversationList: conversationSort(
          [...list, ...state.conversationList],
          state.conversationList,
        ),
      }));
      return;
    }
    let filterArr: ConversationItem[] = [];
    const chids = list.map((ch) => ch.conversationID);
    filterArr = get().conversationList.filter(
      (tc) => !chids.includes(tc.conversationID),
    );

    set(() => ({ conversationList: conversationSort([...list, ...filterArr]) }));
  },
  delConversationByCID: (conversationID: string) => {
    const tmpConversationList = get().conversationList;
    const idx = tmpConversationList.findIndex(
      (cve) => cve.conversationID === conversationID,
    );
    if (idx < 0) {
      return;
    }
    tmpConversationList.splice(idx, 1);
    set(() => ({ conversationList: [...tmpConversationList] }));
  },
  getPinnedMessages: (conversationID: string, toggleId?: number) => {
    IMSDK.getConversationPinnedMsg(conversationID)
      .then(({ data }) => {
        if (toggleId && toggleId !== currentToggleConversationId) {
          console.warn("getPinnedMessages: toggleId mismatch, ignoring response");
          return;
        }
        set(() => ({ pinnedMessages: data }));
      })
      .catch((error) => {
        console.error("get pinned message failed", error);
      });
  },
  setPinnedMessages: (messages: MessageItem[]) => {
    set(() => ({ pinnedMessages: messages }));
  },
  addPinnedMessage: async (conversationID: string, message: MessageItem) => {
    if (
      get().pinnedMessages.some(
        (pinnedMessage) => pinnedMessage.clientMsgID === message.clientMsgID,
      )
    ) {
      return;
    }
    await IMSDK.setConversationPinnedMsg({
      conversationID,
      clientMsgID: message.clientMsgID,
      pinned: true,
    });
    set((state) => ({
      pinnedMessages: [message, ...state.pinnedMessages],
    }));
  },
  removePinnedMessage: async (message: MessageItem) => {
    await IMSDK.setConversationPinnedMsg({
      // eslint-disable-next-line
      conversationID: get().currentConversation?.conversationID!,
      clientMsgID: message.clientMsgID,
      pinned: false,
    });
    set((state) => ({
      pinnedMessages: state.pinnedMessages.filter(
        (pinnedMessage) => pinnedMessage.clientMsgID !== message.clientMsgID,
      ),
    }));
  },
  clearPinnedMessages: () => {
    set(() => ({ pinnedMessages: [] }));
  },
  updateCurrentConversation: async (
    conversation?: ConversationItem,
    isJump?: boolean,
  ) => {
    if (!conversation) {
      set(() => ({
        currentConversation: undefined,
        quoteMessage: undefined,
        currentGroupInfo: undefined,
        currentMemberInGroup: undefined,
      }));
      return;
    }
    const prevConversation = get().currentConversation;

    const toggleNewConversation =
      conversation.conversationID !== prevConversation?.conversationID;
    if (toggleNewConversation) {
      const toggleId = ++currentToggleConversationId;
      get().clearPinnedMessages();
      if (isGroupSession(conversation.conversationType)) {
        get().getPinnedMessages(conversation.conversationID, toggleId);
        get().getCurrentGroupInfoByReq(conversation.groupID, toggleId);
        await get().getCurrentMemberInGroupByReq(conversation.groupID);
      }
      if (!isJump) {
        useMessageStore.getState().updateJumpClientMsgID();
      }
    }
    set(() => ({ currentConversation: { ...conversation } }));
  },
  updateCurrentConversationFields: (fields: Partial<ConversationItem>) => {
    set((state) => ({
      currentConversation: {
        ...state.currentConversation!,
        ...fields,
      },
    }));
  },
  getUnReadCountByReq: async () => {
    try {
      const { data } = await IMSDK.getTotalUnreadMsgCount();
      set(() => ({ unReadCount: data }));
      return data;
    } catch (error) {
      console.error(error);
      return 0;
    }
  },
  updateUnReadCount: (count: number) => {
    set(() => ({ unReadCount: count }));
  },
  getCurrentGroupInfoByReq: async (groupID: string, toggleId?: number) => {
    let groupInfo: GroupItem;
    try {
      const { data } = await IMSDK.getSpecifiedGroupsInfo([groupID]);
      groupInfo = data[0];
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getGroupInfoFailed") });
      return;
    }
    if (toggleId && toggleId !== currentToggleConversationId) {
      console.warn("getCurrentGroupInfoByReq: toggleId mismatch, ignoring response");
      return;
    }
    set(() => ({ currentGroupInfo: { ...groupInfo } }));
  },
  updateCurrentGroupInfo: (groupInfo: GroupItem) => {
    set(() => ({ currentGroupInfo: { ...groupInfo } }));
  },
  getCurrentMemberInGroupByReq: async (groupID: string) => {
    let memberInfo: GroupMemberItem;
    const selfID = useUserStore.getState().selfInfo.userID;
    try {
      const { data } = await IMSDK.getSpecifiedGroupMembersInfo({
        groupID,
        userIDList: [selfID],
      });
      memberInfo = data[0];
    } catch (error) {
      set(() => ({ currentMemberInGroup: undefined }));
      feedbackToast({ error, msg: t("toast.getGroupMemberFailed") });
      return;
    }
    set(() => ({ currentMemberInGroup: memberInfo ? { ...memberInfo } : undefined }));
  },
  setCurrentMemberInGroup: (memberInfo?: GroupMemberItem) => {
    set(() => ({ currentMemberInGroup: memberInfo }));
  },
  tryUpdateCurrentMemberInGroup: (member: GroupMemberItem) => {
    const currentMemberInGroup = get().currentMemberInGroup;
    if (
      member.groupID === currentMemberInGroup?.groupID &&
      member.userID === currentMemberInGroup?.userID
    ) {
      set(() => ({ currentMemberInGroup: { ...member } }));
    }
  },
  updateQuoteMessage: (message?: MessageItem) => {
    set(() => ({ quoteMessage: message }));
  },
  addRevokedMessage: (message: MessageItem, quoteMessage?: MessageItem) => {
    set((state) => ({
      revokeMap: {
        ...state.revokeMap,
        [message.clientMsgID]: {
          text: parseTwemoji(getMessageText(message)),
          atEl: message.atTextElem,
          quoteMessage,
        },
      },
    }));
  },
  clearConversationStore: () => {
    set(() => ({
      conversationList: [],
      currentConversation: undefined,
      unReadCount: 0,
      currentGroupInfo: undefined,
      currentMemberInGroup: undefined,
      quoteMessage: undefined,
    }));
  },
  addFile: (file: FileWithPath) => {
    if (file.uuid) {
      set((state) => ({ fileMap: { ...state.fileMap, [file.uuid!]: file } }));
    }
    if (file.path) {
      set((state) => ({ fileMap: { ...state.fileMap, [file.path]: null } }));
    }
  },
  deleteFile: (uuid: string) => {
    set((state) => {
      const fileMap = { ...state.fileMap };
      delete fileMap[uuid];
      return { fileMap };
    });
  },
  clearFileMap: () => {
    set(() => ({ fileMap: {} }));
  },
}));

const getMessageText = (message: MessageItem) => {
  if (message.contentType === MessageType.AtTextMessage) {
    return message.atTextElem!.text;
  }
  if (message.contentType === MessageType.QuoteMessage) {
    return message.quoteElem!.text;
  }
  return message.textElem!.content;
};
