import { CbEvents } from "@openim/wasm-client-sdk";
import {
  MessageReceiveOptType,
  MessageType,
  SessionType,
} from "@openim/wasm-client-sdk";
import {
  BlackUserItem,
  ConversationItem,
  FriendApplicationItem,
  FriendUserItem,
  GroupApplicationItem,
  GroupItem,
  GroupMemberItem,
  MessageItem,
  PinnedMessageChangeData,
  RevokedInfo,
  SelfUserInfo,
  WSEvent,
  WsResponse,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { t } from "i18next";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { BusinessAllowType } from "@/api/login";
import messageRing from "@/assets/audio/newMsg.mp3";
import { getApiUrl, getLogLevel, getWsUrl } from "@/config";
import { SystemMessageTypes } from "@/constants";
import { useEventTransfer } from "@/hooks/useEventTransfer";
import {
  deleteMessagesByUser,
  deleteOneMessage,
  pushNewMessage,
  syncNewMessages,
  updateMessageNicknameAndFaceUrl,
  updateOneMessage,
} from "@/pages/chat/queryChat/useHistoryMessageList";
import {
  ExMessageItem,
  useConversationStore,
  useMessageStore,
  useUserStore,
} from "@/store";
import { useContactStore } from "@/store/contact";
import { feedbackToast } from "@/utils/common";
import { emit } from "@/utils/events";
import {
  createNotification,
  formatMessageByType,
  initStore,
  isGroupSession,
} from "@/utils/imCommon";
import { clearIMProfile, getIMToken, getIMUserID } from "@/utils/storage";

import { IMSDK } from "./MainContentWrap";

export function useGlobalEvent() {
  const navigate = useNavigate();
  const resume = useRef(false);

  // user
  const updateSyncState = useUserStore((state) => state.updateSyncState);
  const updateProgressState = useUserStore((state) => state.updateProgressState);
  const updateReinstallState = useUserStore((state) => state.updateReinstallState);
  const updateIsLogining = useUserStore((state) => state.updateIsLogining);
  const updateConnectState = useUserStore((state) => state.updateConnectState);
  const updateSelfInfo = useUserStore((state) => state.updateSelfInfo);
  const getWorkMomentsUnreadCount = useUserStore(
    (state) => state.getWorkMomentsUnreadCount,
  );
  const userLogout = useUserStore((state) => state.userLogout);
  // conversation
  const updateConversationList = useConversationStore(
    (state) => state.updateConversationList,
  );
  const updateCurrentConversation = useConversationStore(
    (state) => state.updateCurrentConversation,
  );
  const updateUnReadCount = useConversationStore((state) => state.updateUnReadCount);
  const updateCurrentGroupInfo = useConversationStore(
    (state) => state.updateCurrentGroupInfo,
  );
  const getCurrentGroupInfoByReq = useConversationStore(
    (state) => state.getCurrentGroupInfoByReq,
  );
  const setCurrentMemberInGroup = useConversationStore(
    (state) => state.setCurrentMemberInGroup,
  );
  const getCurrentMemberInGroupByReq = useConversationStore(
    (state) => state.getCurrentMemberInGroupByReq,
  );
  const tryUpdateCurrentMemberInGroup = useConversationStore(
    (state) => state.tryUpdateCurrentMemberInGroup,
  );
  const getConversationListByReq = useConversationStore(
    (state) => state.getConversationListByReq,
  );
  const getUnReadCountByReq = useConversationStore(
    (state) => state.getUnReadCountByReq,
  );
  const setPinnedMessages = useConversationStore((state) => state.setPinnedMessages);
  // message
  const tryAddPreviewImg = useMessageStore((state) => state.tryAddPreviewImg);
  // contact
  const getFriendListByReq = useContactStore((state) => state.getFriendListByReq);
  const getGroupListByReq = useContactStore((state) => state.getGroupListByReq);
  const updateFriend = useContactStore((state) => state.updateFriend);
  const pushNewFriend = useContactStore((state) => state.pushNewFriend);
  const updateBlack = useContactStore((state) => state.updateBlack);
  const pushNewBlack = useContactStore((state) => state.pushNewBlack);
  const updateGroup = useContactStore((state) => state.updateGroup);
  const pushNewGroup = useContactStore((state) => state.pushNewGroup);
  const updateRecvFriendApplication = useContactStore(
    (state) => state.updateRecvFriendApplication,
  );
  const updateSendFriendApplication = useContactStore(
    (state) => state.updateSendFriendApplication,
  );
  const updateRecvGroupApplication = useContactStore(
    (state) => state.updateRecvGroupApplication,
  );
  const updateSendGroupApplication = useContactStore(
    (state) => state.updateSendGroupApplication,
  );

  let cacheConversationList = [] as ConversationItem[];
  let audioEl: HTMLAudioElement | null = null;

  useEventTransfer();

  useEffect(() => {
    loginCheck();
    cacheConversationList = [];
    setIMListener();
    const unsubscribeIpc = setIpcListener();

    const handleOnline = () => {
      IMSDK.networkStatusChanged();
    };
    const handleOffline = () => {
      IMSDK.networkStatusChanged();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      disposeIMListener();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribeIpc?.();
      audioEl?.pause();
      audioEl = null;
    };
  }, []);

  const loginCheck = async () => {
    const IMToken = (await getIMToken()) as string;
    const IMUserID = (await getIMUserID()) as string;
    if (!IMToken || !IMUserID) {
      clearIMProfile();
      navigate("/login");
      return;
    }
    tryLogin();
  };

  const tryLogin = async () => {
    updateIsLogining(true);
    const IMToken = (await getIMToken()) as string;
    const IMUserID = (await getIMUserID()) as string;
    try {
      if (window.electronAPI?.enableCLib) {
        await IMSDK.initSDK({
          platformID: window.electronAPI?.getPlatform() ?? 5,
          apiAddr: getApiUrl(),
          wsAddr: getWsUrl(),
          dataDir: window.electronAPI.getDataPath("sdkResources") || "./",
          logFilePath: window.electronAPI.getDataPath("logsPath") || "./",
          logLevel: getLogLevel(),
          isLogStandardOutput: false,
          systemType: "electron",
        });
        await IMSDK.login({
          userID: IMUserID,
          token: IMToken,
        });
      } else {
        await IMSDK.login({
          userID: IMUserID,
          token: IMToken,
          platformID: window.electronAPI?.getPlatform() ?? 5,
          apiAddr: getApiUrl(),
          wsAddr: getWsUrl(),
          logLevel: getLogLevel(),
        });
      }
      window.electronAPI?.setUserCachePath(IMUserID);
      initStore();
    } catch (error) {
      if ((error as WsResponse).errCode !== 10102) {
        clearIMProfile();
        navigate("/login");
      } else {
        window.electronAPI?.setUserCachePath(IMUserID);
        initStore();
      }
    }
    updateIsLogining(false);
  };

  const setIMListener = () => {
    // account
    IMSDK.on(CbEvents.OnSelfInfoUpdated, selfUpdateHandler);
    IMSDK.on(CbEvents.OnConnecting, connectingHandler);
    IMSDK.on(CbEvents.OnConnectFailed, connectFailedHandler);
    IMSDK.on(CbEvents.OnConnectSuccess, connectSuccessHandler);
    IMSDK.on(CbEvents.OnKickedOffline, kickHandler);
    IMSDK.on(CbEvents.OnUserTokenExpired, expiredHandler);
    IMSDK.on(CbEvents.OnUserTokenInvalid, expiredHandler);
    // sync
    IMSDK.on(CbEvents.OnSyncServerStart, syncStartHandler);
    IMSDK.on(CbEvents.OnSyncServerProgress, syncProgressHandler);
    IMSDK.on(CbEvents.OnSyncServerFinish, syncFinishHandler);
    IMSDK.on(CbEvents.OnSyncServerFailed, syncFailedHandler);
    // message
    IMSDK.on(CbEvents.OnRecvNewMessage, newMessageHandler);
    IMSDK.on(CbEvents.OnRecvOfflineNewMessage, newMessageHandler);
    IMSDK.on(CbEvents.OnRecvNewMessages, newMessageHandler);
    IMSDK.on(CbEvents.OnNewRecvMessageRevoked, revokedMessageHandler);
    IMSDK.on(CbEvents.OnMessageModified, messageModifyHandler);
    IMSDK.on(CbEvents.OnMsgDeleted, messageDeletedHandler);
    IMSDK.on(CbEvents.OnDeleteUserAllMsgsInConv, userMessageInConvDeletedHandler);
    IMSDK.on(CbEvents.OnChangedPinnedMsg, changedPinnedMsgHandler);
    // conversation
    IMSDK.on(CbEvents.OnConversationChanged, conversationChnageHandler);
    IMSDK.on(CbEvents.OnNewConversation, newConversationHandler);
    IMSDK.on(CbEvents.OnTotalUnreadMessageCountChanged, totalUnreadChangeHandler);
    // friend
    IMSDK.on(CbEvents.OnFriendInfoChanged, friednInfoChangeHandler);
    IMSDK.on(CbEvents.OnFriendAdded, friednAddedHandler);
    IMSDK.on(CbEvents.OnFriendDeleted, friednDeletedHandler);
    // blacklist
    IMSDK.on(CbEvents.OnBlackAdded, blackAddedHandler);
    IMSDK.on(CbEvents.OnBlackDeleted, blackDeletedHandler);
    // group
    IMSDK.on(CbEvents.OnJoinedGroupAdded, joinedGroupAddedHandler);
    IMSDK.on(CbEvents.OnJoinedGroupDeleted, joinedGroupDeletedHandler);
    IMSDK.on(CbEvents.OnGroupDismissed, joinedGroupDismissHandler);
    IMSDK.on(CbEvents.OnGroupInfoChanged, groupInfoChangedHandler);
    IMSDK.on(CbEvents.OnGroupMemberAdded, groupMemberAddedHandler);
    IMSDK.on(CbEvents.OnGroupMemberDeleted, groupMemberDeletedHandler);
    IMSDK.on(CbEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler);
    // application
    IMSDK.on(CbEvents.OnFriendApplicationAdded, friendApplicationProcessedHandler);
    IMSDK.on(CbEvents.OnFriendApplicationAccepted, friendApplicationProcessedHandler);
    IMSDK.on(CbEvents.OnFriendApplicationRejected, friendApplicationProcessedHandler);
    IMSDK.on(CbEvents.OnGroupApplicationAdded, groupApplicationProcessedHandler);
    IMSDK.on(CbEvents.OnGroupApplicationAccepted, groupApplicationProcessedHandler);
    IMSDK.on(CbEvents.OnGroupApplicationRejected, groupApplicationProcessedHandler);
    // custom
    IMSDK.on(CbEvents.OnRecvCustomBusinessMessage, customMessageHandler);
  };

  const selfUpdateHandler = ({ data }: WSEvent<SelfUserInfo>) => {
    updateMessageNicknameAndFaceUrl({
      sendID: data.userID,
      senderNickname: data.nickname,
      senderFaceUrl: data.faceURL,
    });
    updateSelfInfo(data);
  };
  const connectingHandler = () => {
    updateConnectState("loading");
    console.log("connecting...");
  };
  const connectFailedHandler = ({ errCode, errMsg }: WSEvent) => {
    updateConnectState("failed");
    console.error("connectFailedHandler", errCode, errMsg);

    if (errCode === 705) {
      tryOut(t("toast.loginExpiration"));
    }
  };
  const connectSuccessHandler = () => {
    updateConnectState("success");
    console.log("connect success...");
  };
  const kickHandler = () => tryOut(t("toast.accountKicked"));
  const expiredHandler = () => tryOut(t("toast.loginExpiration"));

  const tryOut = (msg: string) =>
    feedbackToast({
      msg,
      error: msg,
      onClose: () => {
        userLogout(true);
      },
    });

  // sync
  const syncStartHandler = ({ data }: WSEvent<boolean>) => {
    updateSyncState("loading");
    updateReinstallState(data);
  };
  const syncProgressHandler = ({ data }: WSEvent<number>) => {
    updateProgressState(data);
  };
  const syncFinishHandler = () => {
    updateSyncState("success");
    getFriendListByReq();
    getGroupListByReq();
    getConversationListByReq(false, true);
    getUnReadCountByReq().then((count) => window.electronAPI?.updateUnreadCount(count));
    resume.current = false;
  };
  const syncFailedHandler = () => {
    updateSyncState("failed");
    resume.current = false;
    feedbackToast({ msg: t("toast.syncFailed"), error: t("toast.syncFailed") });
  };

  // message
  const newMessageHandler = ({ data }: WSEvent<ExMessageItem[] | ExMessageItem>) => {
    if (!Array.isArray(data)) {
      data = [data];
    }
    if (useUserStore.getState().syncState === "loading" || resume.current) {
      if (
        inCurrentConversation(data[0]) &&
        !useMessageStore.getState().jumpClientMsgID
      ) {
        syncNewMessages();
        resume.current = false;
      }
      return;
    }
    data.map((message) => handleNewMessage(message));
  };

  const revokedMessageHandler = ({ data }: WSEvent<RevokedInfo>) => {
    updateOneMessage({
      clientMsgID: data.clientMsgID,
      contentType: MessageType.RevokeMessage,
      isAppend: true,
      notificationElem: {
        detail: JSON.stringify(data),
      },
    } as ExMessageItem);
  };

  const messageModifyHandler = ({ data }: WSEvent<MessageItem>) => {
    if (!inCurrentConversation(data)) return;
    updateOneMessage(data as ExMessageItem);
  };

  const messageDeletedHandler = ({ data }: WSEvent<MessageItem>) => {
    if (!inCurrentConversation(data)) return;
    deleteOneMessage(data.clientMsgID);
  };

  const userMessageInConvDeletedHandler = ({
    data,
  }: WSEvent<{ conversationID: string; userID: string }>) => {
    if (
      data.conversationID !==
      useConversationStore.getState().currentConversation?.conversationID
    )
      return;
    deleteMessagesByUser(data.userID);
  };

  const changedPinnedMsgHandler = ({ data }: WSEvent<PinnedMessageChangeData>) => {
    setPinnedMessages(data.msgs.map((msg) => msg.msg));
  };

  const newMessageNotify = async (newServerMsg: ExMessageItem) => {
    if (useUserStore.getState().syncState === "loading") {
      return;
    }

    const selfInfo = useUserStore.getState().selfInfo;
    if (
      selfInfo.allowBeep === BusinessAllowType.NotAllow ||
      selfInfo.globalRecvMsgOpt !== MessageReceiveOptType.Normal
    ) {
      return;
    }

    let cveItem = [
      ...useConversationStore.getState().conversationList,
      ...cacheConversationList,
    ].find((conversation) => {
      if (isGroupSession(newServerMsg.sessionType)) {
        return newServerMsg.groupID === conversation.groupID;
      }
      return newServerMsg.sendID === conversation.userID;
    });

    if (!cveItem) {
      try {
        const { data } = await IMSDK.getOneConversation({
          sessionType: newServerMsg.sessionType,
          sourceID: newServerMsg.groupID || newServerMsg.sendID,
        });
        cveItem = data;
        cacheConversationList = [...cacheConversationList, { ...cveItem }];
      } catch (e) {
        return;
      }
    }

    if (cveItem.recvMsgOpt !== MessageReceiveOptType.Normal) {
      return;
    }

    if (window.electronAPI) {
      window.electronAPI?.triggerNewMessage({
        conversationId: cveItem.conversationID,
        conversationName: cveItem.showName,
        senderName: newServerMsg.senderNickname,
        text: formatMessageByType(newServerMsg),
        isGroup:
          Boolean(cveItem.groupID) &&
          !SystemMessageTypes.includes(newServerMsg.contentType),
      });
    } else {
      createNotification({
        message: newServerMsg,
        conversation: cveItem,
        callback: async (conversation) => {
          if (
            useConversationStore.getState().currentConversation?.conversationID ===
            conversation.conversationID
          )
            return;
          await updateCurrentConversation({ ...conversation, unreadCount: 1 });
          navigate(`/chat/${conversation.conversationID}`);
        },
      });
    }

    if (!audioEl) {
      audioEl = document.createElement("audio");
    }
    audioEl.src = messageRing;
    audioEl.play();
  };

  const notPushType = [MessageType.TypingMessage, MessageType.RevokeMessage];

  const handleNewMessage = (newServerMsg: ExMessageItem) => {
    const needNotification =
      !notPushType.includes(newServerMsg.contentType) &&
      newServerMsg.sendID !== useUserStore.getState().selfInfo.userID;

    if (needNotification) {
      if (
        document.visibilityState === "hidden" ||
        !inCurrentConversation(newServerMsg)
      ) {
        newMessageNotify(newServerMsg);
      }
    }

    if (!inCurrentConversation(newServerMsg)) return;

    if (!notPushType.includes(newServerMsg.contentType)) {
      const needAppend =
        newServerMsg.sendID !== useUserStore.getState().selfInfo.userID ||
        SystemMessageTypes.includes(newServerMsg.contentType);
      const isSearchMode = Boolean(useMessageStore.getState().jumpClientMsgID);
      if ((isSearchMode || document.hidden) && needAppend) {
        emit("UPDATE_IS_HAS_NEW_MESSAGES", true);
        newServerMsg.isAppend = needAppend;
      }
      pushNewMessage(newServerMsg);

      if (!isSearchMode) {
        tryAddPreviewImg([newServerMsg]);
      }
    }
  };

  const inCurrentConversation = (newServerMsg: ExMessageItem) => {
    switch (newServerMsg.sessionType) {
      case SessionType.Single:
        return (
          newServerMsg.sendID ===
            useConversationStore.getState().currentConversation?.userID ||
          (newServerMsg.sendID === useUserStore.getState().selfInfo.userID &&
            newServerMsg.recvID ===
              useConversationStore.getState().currentConversation?.userID)
        );
      case SessionType.Group:
      case SessionType.WorkingGroup:
        return (
          newServerMsg.groupID ===
          useConversationStore.getState().currentConversation?.groupID
        );
      case SessionType.Notification:
        return (
          newServerMsg.sendID ===
          useConversationStore.getState().currentConversation?.userID
        );
      default:
        return false;
    }
  };

  // conversation
  const conversationChnageHandler = ({ data }: WSEvent<ConversationItem[]>) => {
    updateConversationList(data, "filter");
  };
  const newConversationHandler = ({ data }: WSEvent<ConversationItem[]>) => {
    updateConversationList(data, "push");
  };
  const totalUnreadChangeHandler = ({ data }: WSEvent<number>) => {
    if (data === useConversationStore.getState().unReadCount) return;
    updateUnReadCount(data);
    if (useUserStore.getState().syncState !== "loading") {
      window.electronAPI?.updateUnreadCount(data);
    }
  };

  // friend
  const friednInfoChangeHandler = ({ data }: WSEvent<FriendUserItem>) => {
    if (data.userID === useConversationStore.getState().currentConversation?.userID) {
      updateMessageNicknameAndFaceUrl({
        sendID: data.userID,
        senderNickname: data.remark || data.nickname,
        senderFaceUrl: data.faceURL,
      });
    }
    updateFriend(data);
  };
  const friednAddedHandler = ({ data }: WSEvent<FriendUserItem>) => {
    pushNewFriend(data);
  };
  const friednDeletedHandler = ({ data }: WSEvent<FriendUserItem>) => {
    updateFriend(data, true);
  };

  // blacklist
  const blackAddedHandler = ({ data }: WSEvent<BlackUserItem>) => {
    pushNewBlack(data);
  };
  const blackDeletedHandler = ({ data }: WSEvent<BlackUserItem>) => {
    IMSDK.getSpecifiedFriendsInfo({
      friendUserIDList: [data.userID],
      filterBlack: true,
    }).then(({ data }) => {
      if (data.length) {
        pushNewFriend(data[0]);
      }
    });
    updateBlack(data, true);
  };

  // group
  const joinedGroupAddedHandler = ({ data }: WSEvent<GroupItem>) => {
    if (data.groupID === useConversationStore.getState().currentConversation?.groupID) {
      updateCurrentGroupInfo(data);
      getCurrentMemberInGroupByReq(data.groupID);
    }
    pushNewGroup(data);
  };
  const joinedGroupDeletedHandler = ({ data }: WSEvent<GroupItem>) => {
    if (data.groupID === useConversationStore.getState().currentConversation?.groupID) {
      getCurrentGroupInfoByReq(data.groupID);
      setCurrentMemberInGroup();
    }
    updateGroup(data, true);
  };
  const joinedGroupDismissHandler = ({ data }: WSEvent<GroupItem>) => {
    if (data.groupID === useConversationStore.getState().currentConversation?.groupID) {
      getCurrentMemberInGroupByReq(data.groupID);
    }
  };
  const groupInfoChangedHandler = ({ data }: WSEvent<GroupItem>) => {
    updateGroup(data);
    if (data.groupID === useConversationStore.getState().currentConversation?.groupID) {
      updateCurrentGroupInfo(data);
    }
  };
  const groupMemberAddedHandler = ({ data }: WSEvent<GroupMemberItem>) => {
    if (
      data.groupID === useConversationStore.getState().currentConversation?.groupID &&
      data.userID === useUserStore.getState().selfInfo.userID
    ) {
      getCurrentMemberInGroupByReq(data.groupID);
    }
  };
  const groupMemberDeletedHandler = ({ data }: WSEvent<GroupMemberItem>) => {
    if (
      data.groupID === useConversationStore.getState().currentConversation?.groupID &&
      data.userID === useUserStore.getState().selfInfo.userID
    ) {
      getCurrentMemberInGroupByReq(data.groupID);
    }
  };
  const groupMemberInfoChangedHandler = ({ data }: WSEvent<GroupMemberItem>) => {
    if (data.groupID === useConversationStore.getState().currentConversation?.groupID) {
      updateMessageNicknameAndFaceUrl({
        sendID: data.userID,
        senderNickname: data.nickname,
        senderFaceUrl: data.faceURL,
      });
      tryUpdateCurrentMemberInGroup(data);
    }
  };

  //application
  const friendApplicationProcessedHandler = ({
    data,
  }: WSEvent<FriendApplicationItem>) => {
    const isRecv = data.toUserID === useUserStore.getState().selfInfo.userID;
    if (isRecv) {
      updateRecvFriendApplication(data);
    } else {
      updateSendFriendApplication(data);
    }
  };
  const groupApplicationProcessedHandler = ({
    data,
  }: WSEvent<GroupApplicationItem>) => {
    const isRecv = data.userID !== useUserStore.getState().selfInfo.userID;
    if (isRecv) {
      updateRecvGroupApplication(data);
    } else {
      updateSendGroupApplication(data);
    }
  };

  // custom
  const customMessageHandler = ({
    data: { key },
  }: WSEvent<{ key: string; data: string }>) => {
    if (key.includes("wm_")) {
      getWorkMomentsUnreadCount();
    }
  };

  const disposeIMListener = () => {
    IMSDK.off(CbEvents.OnSelfInfoUpdated, selfUpdateHandler);
    IMSDK.off(CbEvents.OnConnecting, connectingHandler);
    IMSDK.off(CbEvents.OnConnectFailed, connectFailedHandler);
    IMSDK.off(CbEvents.OnConnectSuccess, connectSuccessHandler);
    IMSDK.off(CbEvents.OnKickedOffline, kickHandler);
    IMSDK.off(CbEvents.OnUserTokenExpired, expiredHandler);
    IMSDK.off(CbEvents.OnUserTokenInvalid, expiredHandler);
    // sync
    IMSDK.off(CbEvents.OnSyncServerStart, syncStartHandler);
    IMSDK.off(CbEvents.OnSyncServerProgress, syncProgressHandler);
    IMSDK.off(CbEvents.OnSyncServerFinish, syncFinishHandler);
    IMSDK.off(CbEvents.OnSyncServerFailed, syncFailedHandler);
    // message
    IMSDK.off(CbEvents.OnRecvNewMessage, newMessageHandler);
    IMSDK.off(CbEvents.OnRecvNewMessages, newMessageHandler);
    IMSDK.off(CbEvents.OnNewRecvMessageRevoked, revokedMessageHandler);
    IMSDK.off(CbEvents.OnMessageModified, messageModifyHandler);
    IMSDK.off(CbEvents.OnMsgDeleted, messageDeletedHandler);
    IMSDK.off(CbEvents.OnDeleteUserAllMsgsInConv, userMessageInConvDeletedHandler);
    IMSDK.off(CbEvents.OnChangedPinnedMsg, changedPinnedMsgHandler);
    // conversation
    IMSDK.off(CbEvents.OnConversationChanged, conversationChnageHandler);
    IMSDK.off(CbEvents.OnNewConversation, newConversationHandler);
    IMSDK.off(CbEvents.OnTotalUnreadMessageCountChanged, totalUnreadChangeHandler);
    // friend
    IMSDK.off(CbEvents.OnFriendInfoChanged, friednInfoChangeHandler);
    IMSDK.off(CbEvents.OnFriendAdded, friednAddedHandler);
    IMSDK.off(CbEvents.OnFriendDeleted, friednDeletedHandler);
    // blacklist
    IMSDK.off(CbEvents.OnBlackAdded, blackAddedHandler);
    IMSDK.off(CbEvents.OnBlackDeleted, blackDeletedHandler);
    // group
    IMSDK.off(CbEvents.OnJoinedGroupAdded, joinedGroupAddedHandler);
    IMSDK.off(CbEvents.OnJoinedGroupDeleted, joinedGroupDeletedHandler);
    IMSDK.off(CbEvents.OnGroupDismissed, joinedGroupDismissHandler);
    IMSDK.off(CbEvents.OnGroupInfoChanged, groupInfoChangedHandler);
    IMSDK.off(CbEvents.OnGroupMemberAdded, groupMemberAddedHandler);
    IMSDK.off(CbEvents.OnGroupMemberDeleted, groupMemberDeletedHandler);
    IMSDK.off(CbEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler);
    // application
    IMSDK.off(CbEvents.OnFriendApplicationAdded, friendApplicationProcessedHandler);
    IMSDK.off(CbEvents.OnFriendApplicationAccepted, friendApplicationProcessedHandler);
    IMSDK.off(CbEvents.OnFriendApplicationRejected, friendApplicationProcessedHandler);
    IMSDK.off(CbEvents.OnGroupApplicationAdded, groupApplicationProcessedHandler);
    IMSDK.off(CbEvents.OnGroupApplicationAccepted, groupApplicationProcessedHandler);
    IMSDK.off(CbEvents.OnGroupApplicationRejected, groupApplicationProcessedHandler);
    // custom
    IMSDK.off(CbEvents.OnRecvCustomBusinessMessage, customMessageHandler);
  };

  const setIpcListener = () => {
    const unsubscribeAppResume = window.electronAPI?.onAppResume(() => {
      if (resume.current) {
        return;
      }
      resume.current = true;
    });
    const unSubscribeOpenConversation = window.electronAPI?.onOpenConversation(
      async (conversationID) => {
        if (
          useConversationStore.getState().currentConversation?.conversationID ===
          conversationID
        )
          return;
        const conversation = useConversationStore
          .getState()
          .conversationList.find((cve) => cve.conversationID === conversationID);
        if (!conversation) {
          return;
        }
        await updateCurrentConversation({ ...conversation, unreadCount: 1 });
        navigate(`/chat/${conversationID}`);
      },
    );

    return () => {
      unsubscribeAppResume?.();
      unSubscribeOpenConversation?.();
    };
  };
}
