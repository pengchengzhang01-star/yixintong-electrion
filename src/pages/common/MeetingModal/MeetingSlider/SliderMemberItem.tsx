import { useIsMuted } from "@livekit/components-react";
import { PublicUserItem } from "@openim/wasm-client-sdk/lib/types/entity";
import clsx from "clsx";
import { t } from "i18next";
import { Participant, Track } from "livekit-client";
import { memo } from "react";

import { useSetPersonalSetting } from "@/api/meeting";
import meeting_slider_camera from "@/assets/images/rtc/meeting_slider_camera.png";
import meeting_slider_camera_off from "@/assets/images/rtc/meeting_slider_camera_off.png";
import meeting_slider_focus from "@/assets/images/rtc/meeting_slider_focus.png";
import meeting_slider_mic from "@/assets/images/rtc/meeting_slider_mic.png";
import meeting_slider_mic_off from "@/assets/images/rtc/meeting_slider_mic_off.png";
import OIMAvatar from "@/components/OIMAvatar";
import { useUserStore } from "@/store";

import styles from "./meeting-slider.module.scss";

type SliderMemberItemProps = {
  roomID: string;
  participant: Participant;
  hostUserID: string;
  beWatchedUserIDList?: string[];
};
export const SliderMemberItem = memo(
  ({ roomID, participant, hostUserID, beWatchedUserIDList }: SliderMemberItemProps) => {
    const selfID = useUserStore((state) => state.selfInfo.userID);

    const { mutate: setPersonalSetting } = useSetPersonalSetting();

    const isVideoMuted = useIsMuted({
      participant,
      source: Track.Source.Camera,
    });
    const isAudioMuted = useIsMuted({
      participant,
      source: Track.Source.Microphone,
    });

    const isHost = participant.identity === hostUserID;
    const isSelf = participant.identity === selfID;
    const selfIsHost = hostUserID === selfID;

    const updateMemberCamera = () => {
      if (!selfIsHost) return;

      setPersonalSetting({
        meetingID: roomID,
        userID: participant.identity,
        // @ts-ignore
        cameraOnEntry: isVideoMuted,
      });
    };

    const updateMemberMic = () => {
      if (!selfIsHost) return;

      setPersonalSetting({
        meetingID: roomID,
        userID: participant.identity,
        // @ts-ignore
        microphoneOnEntry: isAudioMuted,
      });
    };

    const userInfo: PublicUserItem | undefined = JSON.parse(
      participant.metadata ?? "{}",
    ).userInfo;

    return (
      <div className={clsx(styles["member-item"])}>
        <div className="flex flex-1 items-center overflow-hidden">
          <OIMAvatar
            size={38}
            shape="circle"
            src={userInfo?.faceURL}
            text={userInfo?.nickname}
          />
          <div className="ml-3 flex flex-col text-xs">
            <div className="truncate">{userInfo?.nickname}</div>
            {isHost || isSelf ? (
              <div className="truncate text-[var(--sub-text)]">{`
            (${isHost ? t("placeholder.compere") : ""}${isHost && isSelf ? "、" : ""}${
                isSelf ? t("you") : ""
              })
            `}</div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center">
          {beWatchedUserIDList?.includes(participant.identity) && (
            <img className="ml-4 h-4 w-4" src={meeting_slider_focus} alt="" />
          )}
          {!isHost && (
            <>
              <img
                className="ml-4 h-4 w-4 cursor-pointer"
                style={{ cursor: !selfIsHost ? "auto" : "pointer" }}
                src={isVideoMuted ? meeting_slider_camera_off : meeting_slider_camera}
                alt=""
                onClick={updateMemberCamera}
              />
              <img
                className="ml-4 h-4 w-4 cursor-pointer"
                style={{ cursor: !selfIsHost ? "auto" : "pointer" }}
                src={isAudioMuted ? meeting_slider_mic_off : meeting_slider_mic}
                alt=""
                onClick={updateMemberMic}
              />
            </>
          )}
        </div>
      </div>
    );
  },
);
