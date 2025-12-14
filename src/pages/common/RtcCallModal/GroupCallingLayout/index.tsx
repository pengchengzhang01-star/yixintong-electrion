import { TrackLoop, TrackRefContext, useTracks } from "@livekit/components-react";
import { CbEvents } from "@openim/wasm-client-sdk";
import {
  GroupMemberItem,
  ParticipantInfo,
  RtcInvite,
  WSEvent,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { Track } from "livekit-client";
import { useEffect, useRef, useState } from "react";

import OIMAvatar from "@/components/OIMAvatar";
import { IMSDK } from "@/layout/MainContentWrap";

import styles from "./group-calling-layout.module.scss";
import { GroupTrackItem } from "./GroupTrackItem";

export const GroupCallingLayout = ({
  isVideoCall,
  busyLineUsers,
  inviteeUserIDList,
  groupID,
  isRecv,
  timeout,
}: {
  isVideoCall: boolean;
  busyLineUsers: string[];
  inviteeUserIDList: string[];
  groupID: string;
  isRecv: boolean;
  timeout: number;
}) => {
  const tracks = useTracks([
    {
      source: Track.Source.Camera,
      withPlaceholder: true,
    },
  ]);
  const audioTracks = useTracks([
    {
      source: Track.Source.Microphone,
      withPlaceholder: true,
    },
  ]);

  const [invitedList, setInvitedList] = useState<GroupMemberItem[]>([]);
  const [connectedMemberIDs, setConnectedMemberIDs] = useState<string[]>([]);

  useEffect(() => {
    const newConnectedMemberIDs = (isVideoCall ? tracks : audioTracks).map(
      (track) => track.participant.identity,
    );
    setConnectedMemberIDs((prevIDs) => [
      ...new Set([...prevIDs, ...newConnectedMemberIDs, ...busyLineUsers]),
    ]);
  }, [isVideoCall, tracks.length, audioTracks.length, busyLineUsers.length]);

  const timer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isRecv) return;
    IMSDK.getSpecifiedGroupMembersInfo({
      groupID,
      userIDList: inviteeUserIDList,
    })
      .then(({ data }) => {
        startTimer();
        setInvitedList(data);
      })
      .catch(() => setInvitedList([]));
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [isRecv]);

  useEffect(() => {
    const rejectHandler = ({
      data: {
        invitation: { roomID },
        participant,
      },
    }: WSEvent<{ invitation: RtcInvite; participant: ParticipantInfo }>) => {
      if (groupID !== roomID) return;
      setInvitedList((prevList) =>
        prevList.filter((member) => member.userID !== participant.userInfo.userID),
      );
    };
    IMSDK.on(CbEvents.OnInviteeRejected, rejectHandler);
    return () => {
      IMSDK.off(CbEvents.OnInviteeRejected, rejectHandler);
    };
  }, [groupID]);

  const startTimer = () => {
    timer.current = setTimeout(() => {
      clearTimeout(timer.current);
      setInvitedList([]);
    }, timeout * 1000);
  };
  return (
    <div className="w-full flex-1 overflow-y-auto px-3 py-3">
      <div className="no-scrollbar grid h-full grid-cols-5 gap-2 overflow-y-auto rounded-md">
        <TrackLoop tracks={isVideoCall ? tracks : audioTracks}>
          <TrackRefContext.Consumer>
            {(track) => track && <GroupTrackItem track={track} />}
          </TrackRefContext.Consumer>
        </TrackLoop>
        {invitedList.map((member) =>
          connectedMemberIDs.includes(member.userID) ? null : (
            <div
              className="relative max-h-[25%] min-h-[92px] w-full"
              key={member.userID}
            >
              <OIMAvatar
                className="h-full w-full"
                src={member.faceURL}
                text={member.nickname}
              />
              <div className={styles["loading-dots"]}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
};
