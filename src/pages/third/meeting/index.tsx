import { CbEvents } from "@openim/wasm-client-sdk";
import {
  ConversationItem,
  FriendUserItem,
  GroupItem,
  WSEvent,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { t } from "i18next";
import { useEffect, useRef, useState } from "react";

import { message } from "@/AntdGlobalComp";
import { useElectronEvent } from "@/hooks/useEventTransfer";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import ChooseModal, { ChooseModalState } from "@/pages/common/ChooseModal";
import { MeetingContent } from "@/pages/common/MeetingModal";
import { useContactStore, useConversationStore, useUserStore } from "@/store";
import emitter from "@/utils/events";
import { setChatToken, setTMToken } from "@/utils/storage";

export const Meeting = () => {
  const str = window.location.href.split("precheck=")[1];
  const precheck = JSON.parse(decodeURIComponent(str));

  const { getSelfInfoByReq } = useUserStore.getState();
  const {
    getFriendListByReq,
    getGroupListByReq,
    updateFriend,
    pushNewFriend,
    pushNewGroup,
    updateGroup,
  } = useContactStore.getState();
  const { updateConversationList, getConversationListByReq } =
    useConversationStore.getState();

  useElectronEvent();

  const chooseModalRef = useRef<OverlayVisibleHandle>(null);
  const [chooseModalState, setChooseModalState] = useState<ChooseModalState>({
    type: "MEETING_INVITE",
  });

  const closeWindow = () => {
    window.electronAPI?.closeWindow("meeting");
  };

  const chooseModalHandler = (params: ChooseModalState) => {
    setChooseModalState({ ...params });
    chooseModalRef.current?.openOverlay();
  };

  const friednInfoChangeHandler = ({ data }: WSEvent<FriendUserItem>) => {
    updateFriend(data);
  };

  const friednAddedHandler = ({ data }: WSEvent<FriendUserItem>) => {
    pushNewFriend(data);
  };

  const friednDeletedHandler = ({ data }: WSEvent<FriendUserItem>) => {
    updateFriend(data, true);
  };

  const conversationChnageHandler = ({ data }: WSEvent<ConversationItem[]>) => {
    updateConversationList(data, "filter");
  };

  const newConversationHandler = ({ data }: WSEvent<ConversationItem[]>) => {
    updateConversationList(data, "push");
  };

  const joinedGroupAddedHandler = ({ data }: WSEvent<GroupItem>) => {
    pushNewGroup(data);
  };

  const joinedGroupDeletedHandler = ({ data }: WSEvent<GroupItem>) => {
    updateGroup(data, true);
  };

  const groupInfoChangedHandler = ({ data }: WSEvent<GroupItem>) => {
    updateGroup(data);
  };

  const repeatOpenHandler = () => {
    message.warning(t("toast.joinedOtherMeeting"));
  };

  const init = async () => {
    if (precheck.imToken && precheck.chatToken) {
      await setTMToken(precheck.imToken as string);
      await setChatToken(precheck.chatToken as string);
      getSelfInfoByReq();
      getFriendListByReq();
      getConversationListByReq();
      getGroupListByReq();
    }
  };

  useEffect(() => {
    init();

    emitter.on("REPEAT_OPEN_MEETING", repeatOpenHandler);
    emitter.on("OPEN_CHOOSE_MODAL", chooseModalHandler);
    IMSDK.on(CbEvents.OnFriendInfoChanged, friednInfoChangeHandler);
    IMSDK.on(CbEvents.OnFriendAdded, friednAddedHandler);
    IMSDK.on(CbEvents.OnFriendDeleted, friednDeletedHandler);
    IMSDK.on(CbEvents.OnConversationChanged, conversationChnageHandler);
    IMSDK.on(CbEvents.OnNewConversation, newConversationHandler);
    IMSDK.on(CbEvents.OnJoinedGroupAdded, joinedGroupAddedHandler);
    IMSDK.on(CbEvents.OnJoinedGroupDeleted, joinedGroupDeletedHandler);
    IMSDK.on(CbEvents.OnGroupInfoChanged, groupInfoChangedHandler);
    return () => {
      emitter.off("REPEAT_OPEN_MEETING", repeatOpenHandler);
      emitter.off("OPEN_CHOOSE_MODAL", chooseModalHandler);
      IMSDK.off(CbEvents.OnFriendInfoChanged, friednInfoChangeHandler);
      IMSDK.off(CbEvents.OnFriendAdded, friednAddedHandler);
      IMSDK.off(CbEvents.OnFriendDeleted, friednDeletedHandler);
      IMSDK.off(CbEvents.OnConversationChanged, conversationChnageHandler);
      IMSDK.off(CbEvents.OnNewConversation, newConversationHandler);
      IMSDK.off(CbEvents.OnJoinedGroupAdded, joinedGroupAddedHandler);
      IMSDK.off(CbEvents.OnJoinedGroupDeleted, joinedGroupDeletedHandler);
      IMSDK.off(CbEvents.OnGroupInfoChanged, groupInfoChangedHandler);
    };
  }, []);

  return (
    <div>
      <ChooseModal ref={chooseModalRef} state={chooseModalState} />
      <MeetingContent
        authData={precheck.authData}
        isOverlayOpen={true}
        closeOverlay={closeWindow}
        forceCenter={() => null}
      />
    </div>
  );
};
