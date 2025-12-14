import { ArrowsAltOutlined, ShrinkOutlined } from "@ant-design/icons";
import {
  RoomAudioRenderer,
  TrackLoop,
  TrackRefContext,
  useConnectionState,
  useParticipants,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import {
  GroupMemberItem,
  PublicUserItem,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { Spin } from "antd";
import clsx from "clsx";
import {
  ConnectionState,
  LocalParticipant,
  Participant,
  ParticipantEvent,
  Track,
} from "livekit-client";
import { memo, useCallback, useEffect, useState } from "react";

import OIMAvatar from "@/components/OIMAvatar";

import { sortParticipants } from "../MeetingModal/sorting";
import { AuthData, InviteData } from "./data";
import { GroupCallingLayout } from "./GroupCallingLayout";
import { GroupTrackItem } from "./GroupCallingLayout/GroupTrackItem";
import { GroupProfile } from "./GroupProfile";
import { RequestCloseOverlayFn } from "./index";
import { RtcControl } from "./RtcControl";

const localVideoClasses =
  "absolute right-3 top-3 !w-[100px] !h-[150px] rounded-md z-10";
const remoteVideoClasses = "absolute top-0 z-0";

interface IRtcLayoutProps {
  connect: boolean;
  isConnected: boolean;
  inviteFetching: boolean;
  isRecv: boolean;
  isGroup: boolean;
  isJoin?: boolean;
  selfID: string;
  inviteData?: InviteData;
  busyLineUsers: string[];
  isSingleWindow?: boolean;
  connectRtc: (data?: AuthData) => void;
  requestCloseOverlay: RequestCloseOverlayFn;
}
export const RtcLayout = ({
  connect,
  isConnected,
  inviteFetching,
  isRecv,
  isGroup,
  isJoin,
  selfID,
  inviteData,
  busyLineUsers,
  isSingleWindow,
  connectRtc,
  requestCloseOverlay,
}: IRtcLayoutProps) => {
  const isVideoCall = inviteData?.invitation?.mediaType === "video";
  const tracks = useTracks([Track.Source.Camera]);
  const remoteParticipant = tracks.find((track) => !isLocal(track.participant));
  const isWaiting = !connect && !isConnected;
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState(false);
  const [showMini, setShowMini] = useState(false);

  const connectState = useConnectionState();

  useEffect(() => {
    if (!remoteParticipant?.participant.identity) return;
    const trackMuteUpdate = () => {
      setIsRemoteVideoMuted(!remoteParticipant?.participant.isCameraEnabled);
    };
    remoteParticipant?.participant.on(ParticipantEvent.TrackMuted, trackMuteUpdate);
    remoteParticipant?.participant.on(ParticipantEvent.TrackUnmuted, trackMuteUpdate);
    trackMuteUpdate();
  }, [remoteParticipant?.participant.identity]);

  const renderContent = () => {
    if (showMini) {
      return null;
    }
    if (!isGroup) {
      if (!isWaiting && isVideoCall && !isRemoteVideoMuted) return null;
      return (
        <SingleProfile
          isWaiting={isWaiting}
          userInfo={inviteData?.participant?.userInfo}
        />
      );
    }

    if (isWaiting && isRecv && !isJoin) {
      return (
        <GroupProfile
          groupID={inviteData?.invitation?.groupID ?? ""}
          memberInfo={
            inviteData?.participant?.groupMemberInfo ?? ({} as GroupMemberItem)
          }
          inviteeUserIDList={inviteData?.invitation?.inviteeUserIDList ?? []}
        />
      );
    }
    return (
      <GroupCallingLayout
        isRecv={isRecv}
        timeout={inviteData?.invitation?.timeout ?? 60}
        groupID={inviteData?.invitation?.groupID ?? ""}
        busyLineUsers={busyLineUsers}
        inviteeUserIDList={inviteData?.invitation?.inviteeUserIDList ?? []}
        isVideoCall={isVideoCall}
      />
    );
  };

  const updateShowMini = useCallback(() => setShowMini((val) => !val), []);

  return (
    <Spin spinning={connectState === ConnectionState.Connecting}>
      {showMini && <MiniCallWin updateShowMini={updateShowMini} isGroup={isGroup} />}
      <div className={clsx("main-content relative", showMini && "!h-0 !w-0")}>
        {!isSingleWindow && !isWaiting && (
          <ShrinkOutlined
            className="absolute bottom-1 right-1 z-10 cursor-pointer text-xl text-[#999]"
            onClick={updateShowMini}
          />
        )}
        <div
          className={clsx(
            "flex h-full flex-col items-center justify-between bg-[#262729]",
            { "!bg-[#F2F8FF]": isWaiting },
          )}
        >
          {renderContent()}
          <RtcControl
            isWaiting={isWaiting}
            isJoin={isJoin}
            isRecv={isRecv}
            selfID={selfID}
            isConnected={isConnected}
            inviteFetching={inviteFetching}
            showMini={showMini}
            // @ts-ignore
            invitation={inviteData?.invitation}
            connectRtc={connectRtc}
            requestCloseOverlay={requestCloseOverlay}
          />
        </div>
        {!isGroup && isConnected && (
          <TrackLoop tracks={tracks}>
            <TrackRefContext.Consumer>
              {(track) =>
                track && (
                  <VideoTrack
                    {...track}
                    className={
                      isLocal(track.participant)
                        ? localVideoClasses
                        : `${remoteVideoClasses} ${isRemoteVideoMuted ? "hidden" : ""}`
                    }
                  />
                )
              }
            </TrackRefContext.Consumer>
          </TrackLoop>
        )}
      </div>
      <RoomAudioRenderer />
    </Spin>
  );
};

interface ISingleProfileProps {
  isWaiting: boolean;
  userInfo?: PublicUserItem;
}
const SingleProfile = ({ isWaiting, userInfo }: ISingleProfileProps) => {
  return (
    <div className="absolute top-[10%] flex flex-col items-center">
      <OIMAvatar size={48} src={userInfo?.faceURL} text={userInfo?.nickname} />
      <div
        className={clsx("mt-3 max-w-[120px] truncate text-white", {
          "!text-[var(--base-black)]": isWaiting,
        })}
      >
        {userInfo?.nickname}
      </div>
    </div>
  );
};

const isLocal = (p: Participant) => {
  return p instanceof LocalParticipant;
};

const MiniCallWin = memo(
  ({ updateShowMini, isGroup }: { updateShowMini: () => void; isGroup: boolean }) => {
    const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
    const participants = useParticipants();
    const sortedParticipants = sortParticipants(participants);
    const activeTrack = tracks.find((track) =>
      isGroup
        ? track.participant.identity === sortedParticipants[0].identity
        : !isLocal(track.participant),
    );

    return (
      <div className="flex h-[136px] w-[220px] flex-col bg-[#2e3030]">
        {activeTrack && (
          <GroupTrackItem className="h-full" track={activeTrack} isSingle={!isGroup} />
        )}
        <ArrowsAltOutlined
          className="absolute bottom-1 right-1 cursor-pointer text-xl text-[#999]"
          onClick={updateShowMini}
        />
      </div>
    );
  },
);
