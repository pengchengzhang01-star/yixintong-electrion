import { CbEvents } from "@openim/wasm-client-sdk";
import {
  CallingRoomData,
  GroupMemberItem,
  ParticipantInfo,
  RtcInvite,
} from "@openim/wasm-client-sdk/lib/types/entity";
import clsx from "clsx";
import { t } from "i18next";
import { useEffect, useState } from "react";

import { message } from "@/AntdGlobalComp";
import arrow_down from "@/assets/images/chatHeader/arrow_down.png";
import arrow_up from "@/assets/images/chatHeader/arrow_up.png";
import member_etc from "@/assets/images/chatHeader/member_etc.png";
import OIMAvatar from "@/components/OIMAvatar";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useUserStore } from "@/store";
import { openRtcCall } from "@/utils/childWindows";
import { emit } from "@/utils/events";

import styles from "./chat-header.module.scss";

export type ParticipantChange = {
  invitation: RtcInvite;
  participant: ParticipantInfo[] | null;
  groupID: string;
};

const GroupCallingCard = () => {
  const [expanded, setExpanded] = useState(false);
  const [roomData, setRoomData] = useState<CallingRoomData>();
  const [memberList, setMemberList] = useState<GroupMemberItem[]>([]);

  const selfUserID = useUserStore((state) => state.selfInfo.userID);
  const currentGroupID = useConversationStore(
    (state) => state.currentConversation?.groupID,
  );

  useEffect(() => {
    resetData();
    setExpanded(false);

    if (!currentGroupID) return;

    IMSDK.signalingGetRoomByGroupID(currentGroupID).then(({ data }) => {
      if (data.invitation) {
        setRoomData(data);
        getMemberList((data.participant ?? []).map((item) => item.userInfo.userID));
      } else {
        resetData();
      }
    });

    const roomParticipantChange = ({ data }: { data: ParticipantChange }) => {
      if (data.groupID !== currentGroupID) return;

      if (!data.participant) {
        resetData();
        return;
      }

      setRoomData({
        invitation: data.invitation,
        participant: data.participant,
        roomID: data.invitation.roomID,
      });
      getMemberList(data.participant.map((item) => item.userInfo.userID));
    };

    IMSDK.on(CbEvents.OnRoomParticipantConnected, roomParticipantChange);
    IMSDK.on(CbEvents.OnRoomParticipantDisconnected, roomParticipantChange);

    return () => {
      IMSDK.off(CbEvents.OnRoomParticipantConnected, roomParticipantChange);
      IMSDK.off(CbEvents.OnRoomParticipantDisconnected, roomParticipantChange);
    };
  }, [currentGroupID]);

  const getMemberList = (userIDList: string[]) => {
    IMSDK.getSpecifiedGroupMembersInfo({
      groupID: currentGroupID!,
      userIDList: userIDList.slice(0, 5),
    }).then(({ data }) => setMemberList(data));
  };

  const resetData = () => {
    setRoomData(undefined);
    setMemberList([]);
  };

  if (!roomData) return null;

  const updateExpanded = () => {
    setExpanded((v) => !v);
  };

  const joinCalling = () => {
    const inMeeting = window.electronAPI?.checkChildWindowStatusSync({
      key: "meeting",
    });
    if (inMeeting) {
      message.warning(t("toast.inMeetingCannotRtcCall"));
      return;
    }
    const inRtc = window.electronAPI?.checkChildWindowStatusSync({
      key: "rtc-call",
    });
    // If user has been in rtc call, open rtc call window to warning user instead of using message.warning()
    if (inRtc) {
      openRtcCall(true, "");
      return;
    }
    if (memberList.find((member) => member.userID === selfUserID)) {
      message.warning(t("toast.joinedOtherDevice"));
      return;
    }
    emit("OPEN_RTC_MODAL", {
      invitation: roomData.invitation,
      participant: roomData.participant?.[0],
      isJoin: true,
    });
  };

  const isVideoCall = roomData.invitation?.mediaType === "video";
  const callingTitle = `${
    isVideoCall ? t("placeholder.videoCall") : t("placeholder.voiceCall")
  }${t("placeholder.underWay")}`;

  return (
    <div className={clsx(styles["calling-card"])}>
      <div className="flex items-center">
        <div className="mr-2 flex-1 truncate text-xs text-[var(--sub-text)]">
          {callingTitle}
        </div>
        <img
          className="cursor-pointer"
          onClick={updateExpanded}
          src={expanded ? arrow_up : arrow_down}
          width={16}
          alt=""
        />
      </div>
      <div
        className={clsx(styles["can-expanded-content"], {
          "!max-h-96": expanded,
        })}
      >
        <div className="my-2">
          {memberList.map((member, idx) =>
            idx < 4 ? (
              <OIMAvatar
                key={member.userID}
                className="mr-2"
                src={member.faceURL}
                text={member.nickname}
                size={36}
              />
            ) : (
              <OIMAvatar key={member.userID} src={member_etc} size={36} />
            ),
          )}
        </div>
        <div className="flex items-center justify-center">
          <span
            className="cursor-pointer text-xs text-[var(--primary)]"
            onClick={joinCalling}
          >
            {t("placeholder.joinCall")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GroupCallingCard;
