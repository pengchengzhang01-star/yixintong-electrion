import { useParticipants } from "@livekit/components-react";
import { Button, Space } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import { memo } from "react";

import { message } from "@/AntdGlobalComp";
import { useUpdateMuteAllState } from "@/api/meeting";
import meeting_member_icon from "@/assets/images/rtc/meeting_member_icon.png";
import { CustomMessageType } from "@/constants";
import { MeetingMetadata } from "@/pb/meeting.pb";
import { useUserStore } from "@/store";
import { emit } from "@/utils/events";

import styles from "./meeting-slider.module.scss";
import { SliderMemberItem } from "./SliderMemberItem";

type MeetingSliderProps = {
  roomID: string;
  isHost: boolean;
  isConnected: boolean;
  meetingDetails: MeetingMetadata;
  updateShowSlider: () => void;
};
export const MeetingSlider = memo(
  ({
    roomID,
    isHost,
    isConnected,
    meetingDetails,
    updateShowSlider,
  }: MeetingSliderProps) => {
    const participants = useParticipants();
    const { mutate: updateMuteAllState } = useUpdateMuteAllState();

    const inviteMember = () => {
      if (!isConnected) {
        message.warning(t("toast.meetingOver"));
        return;
      }

      const selfInfo = useUserStore.getState().selfInfo;
      const meetingInfo = {
        inviterFaceURL: selfInfo.faceURL,
        id: roomID,
        duration: meetingDetails.detail?.info?.creatorDefinedMeeting
          ?.meetingDuration as unknown as number,
        inviterNickname: selfInfo.nickname,
        inviterUserID: selfInfo.userID,
        subject: meetingDetails.detail?.info?.creatorDefinedMeeting?.title,
        start: meetingDetails.detail?.info?.systemGenerated?.startTime,
      };
      emit("OPEN_CHOOSE_MODAL", {
        type: "MEETING_INVITE",
        extraData: {
          data: JSON.stringify({
            customType: CustomMessageType.MeetingInvitation,
            data: meetingInfo,
          }),
          extension: "",
          description: "",
        },
      });
    };

    const updateMuteAll = (isMute: boolean) => {
      updateMuteAllState({
        meetingID: roomID,
        operatorUserID: useUserStore.getState().selfInfo.userID,
        // @ts-ignore
        microphoneOnEntry: !isMute,
      });
    };

    return (
      <div className={styles["slider-wrap"]}>
        <div className={clsx("ignore-drag", styles["title-row"])}>
          <div className="flex items-center">
            <img className="h-[13.5px] w-[13.5px]" src={meeting_member_icon} alt="" />
            <span>{`${t("placeholder.member")}（${participants.length}）`}</span>
          </div>
          <span className="cursor-pointer" onClick={updateShowSlider}>
            {t("placeholder.fold")}
          </span>
        </div>
        <div className="flex-1">
          {participants.map((participant) => (
            <SliderMemberItem
              key={participant.identity}
              roomID={roomID}
              hostUserID={
                meetingDetails.detail?.info?.creatorDefinedMeeting?.hostUserID as string
              }
              participant={participant}
              // beWatchedUserIDList={[meetingDetails.personalData?.[0].userID as string]}
              // pinedUserIDList={meetingDetails.pinedUserIDList}
            />
          ))}
        </div>
        <div
          className={clsx("flex items-center justify-center p-3", styles["row-shadow"])}
        >
          <Space>
            <Button onClick={inviteMember}>{t("placeholder.invitation")}</Button>
            {isHost && (
              <>
                <Button onClick={() => updateMuteAll(true)}>
                  {t("placeholder.muteAllVoice")}
                </Button>
                <Button onClick={() => updateMuteAll(false)}>
                  {t("placeholder.cancelMuteAllVoice")}
                </Button>
              </>
            )}
          </Space>
        </div>
      </div>
    );
  },
);
