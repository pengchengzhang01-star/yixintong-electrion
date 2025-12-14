import { CbEvents } from "@openim/wasm-client-sdk";
import {
  GroupItem,
  RtcInvite,
  RtcInviteResults,
  WSEvent,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { useLatest } from "ahooks";
import { Popover } from "antd";
import i18n, { t } from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";

import { message } from "@/AntdGlobalComp";
import add_friend from "@/assets/images/topSearchBar/add_friend.png";
import add_group from "@/assets/images/topSearchBar/add_group.png";
import create_group from "@/assets/images/topSearchBar/create_group.png";
import meeting from "@/assets/images/topSearchBar/meeting.png";
import search from "@/assets/images/topSearchBar/search.png";
import show_more from "@/assets/images/topSearchBar/show_more.png";
import WindowControlBar from "@/components/WindowControlBar";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import ChooseModal, { ChooseModalState } from "@/pages/common/ChooseModal";
import GlobalSearchModal from "@/pages/common/GlobalSearchModal";
import GroupCardModal from "@/pages/common/GroupCardModal";
import MeetingManageModal from "@/pages/common/MeetingManageModal";
import MeetingModal from "@/pages/common/MeetingModal";
import MomentsModal, { RouteTravel } from "@/pages/common/MomentsModal";
import RtcCallModal from "@/pages/common/RtcCallModal";
import { InviteData, ParticipantInfo } from "@/pages/common/RtcCallModal/data";
import UserCardModal, { CardInfo } from "@/pages/common/UserCardModal";
import { useContactStore, useUserStore } from "@/store";
import {
  openGlobalSearch,
  openMeeting,
  openMeetingManage,
  openMoments,
  openRtcCall,
} from "@/utils/childWindows";
import emitter, { emitToSpecifiedWindow, OpenUserCardParams } from "@/utils/events";
import { createRTCNotification } from "@/utils/imCommon";
import { isRtcOrMeetingBusy } from "@/utils/rtc";

import { IMSDK } from "../MainContentWrap";
import SearchUserOrGroup from "./SearchUserOrGroup";

type UserCardState = OpenUserCardParams & {
  cardInfo?: CardInfo;
};

const TopSearchBar = () => {
  const userCardRef = useRef<OverlayVisibleHandle>(null);
  const groupCardRef = useRef<OverlayVisibleHandle>(null);
  const chooseModalRef = useRef<OverlayVisibleHandle>(null);
  const searchModalRef = useRef<OverlayVisibleHandle>(null);
  const momentModalRef = useRef<OverlayVisibleHandle>(null);
  const [momentModalState, setMomentModalState] = useState<RouteTravel>({
    userID: "",
    nickname: "",
    faceURL: "",
  });
  const globalSearchModalRef = useRef<OverlayVisibleHandle>(null);
  const rtcRef = useRef<OverlayVisibleHandle>(null);
  const meetingManageRef = useRef<OverlayVisibleHandle>(null);
  const meetingRef = useRef<OverlayVisibleHandle>(null);
  const [chooseModalState, setChooseModalState] = useState<ChooseModalState>({
    type: "CRATE_GROUP",
  });
  const [userCardState, setUserCardState] = useState<UserCardState>();
  const [groupCardData, setGroupCardData] = useState<
    GroupItem & { inGroup?: boolean }
  >();
  const [actionVisible, setActionVisible] = useState(false);
  const [isSearchGroup, setIsSearchGroup] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData>({} as InviteData);
  const [meetingAuthData, setMeetingAuthData] = useState<RtcInviteResults>();

  const selfUserID = useUserStore((state) => state.selfInfo.userID);

  const latestUserID = useLatest(selfUserID);

  useEffect(() => {
    const userCardHandler = (params: OpenUserCardParams) => {
      setUserCardState({ ...params, isSelf: params.userID === latestUserID.current });
      userCardRef.current?.openOverlay();
    };
    const chooseModalHandler = (params: ChooseModalState) => {
      setChooseModalState({ ...params });
      chooseModalRef.current?.openOverlay();
    };
    const momentsModalHandler = (params: RouteTravel) => {
      setMomentModalState({ ...params });
      if (window.electronAPI?.enableCLib) {
        openMoments(params);
        const state = window.electronAPI?.checkChildWindowStatusSync({
          key: "moments",
        });
        if (state) {
          emitToSpecifiedWindow("SET_MOMENTS_USER", params, "moments");
          return;
        }
        return;
      }
      momentModalRef.current?.openOverlay();
    };
    const callRtcHandler = (inviteData: InviteData) => {
      if (rtcRef.current?.isOverlayOpen) return;

      if (isRtcOrMeetingBusy()) {
        return;
      }

      if (window.electronAPI?.enableCLib) {
        openRtcCall(
          Boolean(inviteData.invitation?.groupID),
          JSON.stringify({
            inviteData,
            isRecv: inviteData.invitation?.inviterUserID !== latestUserID.current,
          }),
        );
        return;
      }
      setInviteData(inviteData);
      rtcRef.current?.openOverlay();
    };
    const recvInvitationHandler = ({
      data,
    }: WSEvent<{ participant: ParticipantInfo; invitation: RtcInvite }>) => {
      if (rtcRef.current?.isOverlayOpen || meetingRef.current?.isOverlayOpen) return;
      if (isRtcOrMeetingBusy()) {
        return;
      }

      if (!window.electronAPI) {
        createRTCNotification({
          message: `${data.participant.userInfo.nickname}${t("placeholder.inviteYou")}${
            data.invitation.mediaType === "video"
              ? t("placeholder.videoCall")
              : t("placeholder.voiceCall")
          }`,
          userInfo: data.participant.userInfo,
          sessionType: data.invitation.sessionType,
        });
      }

      if (window.electronAPI?.enableCLib) {
        openRtcCall(
          Boolean(data.invitation?.groupID),
          JSON.stringify({
            inviteData: data,
            isRecv: data.invitation?.inviterUserID !== latestUserID.current,
          }),
        );
        return;
      }
      setInviteData(data);
      rtcRef.current?.openOverlay();
    };

    const startMeetingHandler = (data: RtcInviteResults) => {
      setMeetingAuthData(data);
      if (window.electronAPI?.enableCLib) {
        const state = window.electronAPI?.checkChildWindowStatusSync({
          key: "meeting",
        });
        if (state) {
          emitToSpecifiedWindow("REPEAT_OPEN_MEETING", undefined, "meeting");
          openMeeting(data);
          return;
        }
        openMeeting(data);
        return;
      }
      meetingRef.current?.openOverlay();
    };

    emitter.on("OPEN_USER_CARD", userCardHandler);
    emitter.on("OPEN_GROUP_CARD", openGroupCardWithData);
    emitter.on("OPEN_CHOOSE_MODAL", chooseModalHandler);
    emitter.on("OPEN_MOMENTS", momentsModalHandler);
    emitter.on("OPEN_RTC_MODAL", callRtcHandler);
    emitter.on("OPEN_MEETING_MODAL", startMeetingHandler);
    IMSDK.on(CbEvents.OnReceiveNewInvitation, recvInvitationHandler);
    return () => {
      emitter.off("OPEN_USER_CARD", userCardHandler);
      emitter.off("OPEN_GROUP_CARD", openGroupCardWithData);
      emitter.off("OPEN_CHOOSE_MODAL", chooseModalHandler);
      emitter.off("OPEN_MOMENTS", momentsModalHandler);
      emitter.off("OPEN_RTC_MODAL", callRtcHandler);
      emitter.off("OPEN_MEETING_MODAL", startMeetingHandler);
      IMSDK.off(CbEvents.OnReceiveNewInvitation, recvInvitationHandler);
    };
  }, []);

  const actionClick = (idx: number) => {
    switch (idx) {
      case 0:
      case 1:
        setIsSearchGroup(Boolean(idx));
        searchModalRef.current?.openOverlay();
        break;
      case 2:
        setChooseModalState({ type: "CRATE_GROUP" });
        chooseModalRef.current?.openOverlay();
        break;
      case 3:
        if (window.electronAPI?.enableCLib) {
          openMeetingManage();
          setActionVisible(false);
          return;
        }
        meetingManageRef.current?.openOverlay();
        break;
      default:
        break;
    }
    setActionVisible(false);
  };

  const openUserCardWithData = useCallback((cardInfo: CardInfo) => {
    searchModalRef.current?.closeOverlay();
    setUserCardState({ userID: cardInfo.userID, cardInfo });
    userCardRef.current?.openOverlay();
  }, []);

  const openGroupCardWithData = useCallback((group: GroupItem) => {
    searchModalRef.current?.closeOverlay();
    const inGroup = useContactStore
      .getState()
      .groupList.some((g) => g.groupID === group.groupID);
    setGroupCardData({ ...group, inGroup });
    groupCardRef.current?.openOverlay();
  }, []);

  const openGlobalSearchModal = () => {
    if (window.electronAPI?.enableCLib) {
      openGlobalSearch();
      return;
    }
    if (globalSearchModalRef.current?.isOverlayOpen) return;
    globalSearchModalRef.current?.openOverlay();
  };

  return (
    <div className="no-mobile app-drag flex h-10 min-h-[40px] items-center bg-[var(--top-search-bar)] dark:bg-[#141414]">
      <div className="flex w-full items-center justify-center">
        <div
          className="app-no-drag flex h-[26px] w-1/3 cursor-pointer items-center justify-center rounded-md bg-[rgba(255,255,255,0.2)]"
          onClick={() => openGlobalSearchModal()}
        >
          <img width={16} src={search} alt="" />
          <span className="ml-2 text-[#D2E3F8]">{t("placeholder.search")}</span>
        </div>
        <Popover
          content={<ActionPopContent actionClick={actionClick} />}
          arrow={false}
          title={null}
          trigger="click"
          placement="bottom"
          open={actionVisible}
          onOpenChange={(vis) => setActionVisible(vis)}
        >
          <img
            className="app-no-drag ml-8 cursor-pointer"
            width={20}
            src={show_more}
            alt=""
          />
        </Popover>
      </div>
      <WindowControlBar />
      <UserCardModal ref={userCardRef} {...userCardState} />
      <GroupCardModal ref={groupCardRef} groupData={groupCardData} />
      <ChooseModal ref={chooseModalRef} state={chooseModalState} />
      <MomentsModal ref={momentModalRef} state={momentModalState} />
      <SearchUserOrGroup
        ref={searchModalRef}
        isSearchGroup={isSearchGroup}
        openUserCardWithData={openUserCardWithData}
        openGroupCardWithData={openGroupCardWithData}
      />
      <RtcCallModal
        inviteData={inviteData}
        isRecv={inviteData.invitation?.inviterUserID !== selfUserID}
        ref={rtcRef}
      />
      <MeetingManageModal ref={meetingManageRef} />
      <MeetingModal ref={meetingRef} authData={meetingAuthData} />
      <GlobalSearchModal ref={globalSearchModalRef} />
    </div>
  );
};

export default TopSearchBar;

const actionMenuList = [
  {
    idx: 0,
    title: t("placeholder.addFriends"),
    icon: add_friend,
  },
  {
    idx: 1,
    title: t("placeholder.addGroup"),
    icon: add_group,
  },
  {
    idx: 2,
    title: t("placeholder.createGroup"),
    icon: create_group,
  },
  {
    idx: 3,
    title: t("placeholder.meeting"),
    icon: meeting,
  },
];

i18n.on("languageChanged", () => {
  actionMenuList[0].title = t("placeholder.addFriends");
  actionMenuList[1].title = t("placeholder.addGroup");
  actionMenuList[2].title = t("placeholder.createGroup");
  actionMenuList[3].title = t("placeholder.meeting");
});

const ActionPopContent = ({ actionClick }: { actionClick: (idx: number) => void }) => {
  return (
    <div className="p-1">
      {actionMenuList.map((action) => (
        <div
          className="flex cursor-pointer items-center rounded px-3 py-2 text-xs hover:bg-[var(--primary-active)]"
          key={action.idx}
          onClick={() => actionClick?.(action.idx)}
        >
          <img width={20} src={action.icon} alt="call_video" />
          <div className="ml-3">{action.title}</div>
        </div>
      ))}
    </div>
  );
};
