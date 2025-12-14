import { DesktopOutlined } from "@ant-design/icons";
import type {
  TrackReference,
  TrackReferencePlaceholder,
} from "@livekit/components-core";
import { useIsMuted, VideoTrack } from "@livekit/components-react";
import { PublicUserItem } from "@openim/wasm-client-sdk/lib/types/entity";
import clsx from "clsx";
import { Track } from "livekit-client";
import { memo } from "react";

import meeting_member_host from "@/assets/images/rtc/meeting_member_host.png";
import meeting_member_mute from "@/assets/images/rtc/meeting_member_mute.png";
import meeting_member_muted from "@/assets/images/rtc/meeting_member_muted.png";
import OIMAvatar from "@/components/OIMAvatar";
import { useUserStore } from "@/store";

import styles from "./meeting-main.module.scss";

type VideoMemberItemProps = {
  hostUserID: string;
  wrapHeight?: number;
  totalLength?: number;
  className?: string;
  track: TrackReference | TrackReferencePlaceholder;
  toggleAllInOne?: (identity: string) => void;
};
export const VideoMemberItem = memo(
  ({
    track,
    hostUserID,
    totalLength,
    className,
    toggleAllInOne,
    wrapHeight = 522,
  }: VideoMemberItemProps) => {
    const userInfo: PublicUserItem | undefined = JSON.parse(
      track.participant?.metadata ?? "{}",
    ).userInfo;
    const isAudioMuted = useIsMuted({
      participant: track.participant,
      source: Track.Source.Microphone,
    });
    const isVideoMuted = useIsMuted({
      participant: track.participant,
      source: Track.Source.Camera,
    });
    const enableScreenShare = Boolean(
      track.participant.getTrackPublication(Track.Source.ScreenShare),
    );
    const isHost = userInfo?.userID === hostUserID;
    const isSelf = useUserStore((state) => state.selfInfo.userID === userInfo?.userID);
    const videoWidth = totalLength
      ? `calc(${totalLength > 4 ? 33.3 : 50}% - 10px)`
      : "100%";
    const videoHeight = totalLength
      ? `${wrapHeight / (totalLength > 4 ? 3 : 2) - 15}px`
      : "100%";

    return (
      <div
        className={clsx(styles["member-video-item"], className)}
        style={{ width: videoWidth, height: videoHeight }}
        onDoubleClick={() => toggleAllInOne?.(track.participant.identity)}
      >
        {isVideoMuted && !enableScreenShare ? (
          <div className="flex flex-1 items-center justify-center">
            <OIMAvatar
              size={72}
              shape="circle"
              src={userInfo?.faceURL}
              text={userInfo?.nickname}
            />
          </div>
        ) : enableScreenShare && isSelf ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex space-x-3 text-white">
              <DesktopOutlined />
              <span>屏幕共享中</span>
            </div>
          </div>
        ) : (
          <VideoTrack trackRef={track as any} />
        )}

        <div className="absolute bottom-3 left-3 flex w-fit items-center rounded-xl bg-[rgba(0,0,0,0.35)] px-2.5 py-1">
          {isHost ? (
            <img width={18} className="mr-1 h-fit" src={meeting_member_host} alt="" />
          ) : null}
          <img
            width={18}
            className="mr-1 h-fit"
            src={!isAudioMuted ? meeting_member_mute : meeting_member_muted}
            alt=""
          />
          <div className="max-w-[80px] truncate text-white">{userInfo?.nickname}</div>
        </div>
      </div>
    );
  },
);
