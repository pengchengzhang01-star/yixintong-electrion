import { Spin } from "antd";
import dayjs from "dayjs";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { useJoinMeeting } from "@/api/meeting";
import meeting_arrow from "@/assets/images/messageItem/meeting_arrow.png";
import meeting_icon from "@/assets/images/messageItem/meeting_icon.png";
import { MeetingInvitation, secondsToTime } from "@/pages/common/MeetingModal/data";
import { useUserStore } from "@/store";
import { checkIsMeeting } from "@/utils/childWindows";
import { emit } from "@/utils/events";

import { IMessageItemProps } from ".";

const MeetingMessageRender: FC<IMessageItemProps> = ({ message }) => {
  const { t } = useTranslation();

  const meetingInfo = JSON.parse(message.customElem!.data).data as MeetingInvitation;
  const { mutateAsync: joinMeetingApi, isLoading } = useJoinMeeting();

  const joinMeeting = () => {
    const hasMeetingWindow = checkIsMeeting();
    if (hasMeetingWindow || isLoading) return;
    joinMeetingApi({
      meetingID: meetingInfo.id,
      userID: useUserStore.getState().selfInfo.userID,
      password: "",
    }).then(({ data }) =>
      emit("OPEN_MEETING_MODAL", {
        roomID: meetingInfo.id,
        liveURL: data.liveKit!.url!,
        token: data.liveKit!.token!,
      }),
    );
  };

  return (
    <Spin spinning={isLoading}>
      <div className="w-60 rounded-md border border-[var(--gap-text)] px-3 py-2">
        <div className="mb-1 flex items-center">
          <img src={meeting_icon} alt="" />
          <div className="ml-2 truncate">{meetingInfo.subject}</div>
        </div>
        <ul className="ml-6 list-disc text-sm">
          <li className="py-1">{`${t("time.startTime")}：${dayjs(
            meetingInfo.start * 1000,
          ).format("M-DD HH:mm")}`}</li>
          <li className="py-1">{`${t("placeholder.meetingTime")}：${
            // @ts-ignore
            secondsToTime[meetingInfo.duration]
          }`}</li>
          <li className="py-1">{`${t("placeholder.meetingID")}：${meetingInfo.id}`}</li>
        </ul>
        <div
          className="mt-1 flex cursor-pointer items-center justify-center"
          onClick={joinMeeting}
        >
          <div className="text-xs text-[var(--primary)]">
            {t("placeholder.joinMeeting")}
          </div>
          <img src={meeting_arrow} alt="" />
        </div>
      </div>
    </Spin>
  );
};

export default MeetingMessageRender;
