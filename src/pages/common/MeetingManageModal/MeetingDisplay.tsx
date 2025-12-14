import { Button } from "antd";
import dayjs from "dayjs";
import { t } from "i18next";
import { memo } from "react";

import { Long, MeetingInfoSetting } from "@/pb/meeting.pb";
import { useUserStore } from "@/store";

import { secondsToTime } from "../MeetingModal/data";
import { LaunchStep } from "./data";

type MeetingDisplayProps = {
  isHost: boolean;
  meetingInfo: MeetingInfoSetting;
  joinLoading: boolean;
  joinMeeting: (roomID: string) => void;
  updateStep: (step: LaunchStep, extraData?: unknown) => void;
};
export const MeetingDisplay = memo(
  ({
    isHost,
    meetingInfo,
    joinLoading,
    updateStep,
    joinMeeting,
  }: MeetingDisplayProps) => {
    const selfName = useUserStore((state) => state.selfInfo.nickname);

    const startTime = meetingInfo.info?.creatorDefinedMeeting
      ?.scheduledTime as Long as unknown as number;
    const duration = meetingInfo.info?.creatorDefinedMeeting
      ?.meetingDuration as Long as unknown as number;
    const meetingID = meetingInfo.info?.systemGenerated?.meetingID as string;

    return (
      <div>
        <h4 className="ml-4">{meetingInfo.info?.creatorDefinedMeeting?.title}</h4>
        <div className="mt-3 flex justify-between p-4">
          <div className="flex flex-col items-center">
            <span>{dayjs.unix(startTime).format("HH:mm")}</span>
            <span className="mt-1 text-xs text-[var(--sub-text)]">
              {dayjs.unix(startTime).format("YYYY-M-D")}
            </span>
          </div>
          <div className="flex flex-col items-center text-xs">
            {Date.now() < startTime * 1000 ? (
              <span className="rounded-xl bg-[#1E74DE] px-3 py-0.5 font-light text-white">
                {t("waitingStart")}
              </span>
            ) : Date.now() < (startTime + duration) * 1000 ? (
              <span
                className="rounded-xl bg-[#1E74DE] px-3 py-0.5 font-light text-white"
                style={{ backgroundColor: "#FF9D3C" }}
              >
                {t("alreadyStarted")}
              </span>
            ) : (
              <span className="rounded-xl bg-[#1E74DE] px-3 py-0.5 font-light text-white">
                {t("finished")}
              </span>
            )}
            <span className="mt-1 text-xs text-[var(--sub-text)]">
              {/* @ts-ignore */}
              {secondsToTime[duration] ?? ""}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span>{dayjs.unix(startTime).add(duration, "s").format("HH:mm")}</span>
            <span className="mt-1 text-xs text-[var(--sub-text)]">
              {dayjs.unix(startTime).add(duration, "s").format("YYYY-M-D")}
            </span>
          </div>
        </div>

        <div className="border-y-8 border-y-[rgba(30,116,222,0.05)] px-4 py-3">
          <div className="mb-1.5">{`${t("placeholder.meetingID")}：${meetingID}`}</div>
          <div>{`${t("placeholder.launchPerson")}：${selfName}`}</div>
        </div>

        <div className="my-24 flex flex-col items-center">
          <Button
            type="primary"
            className="w-[60%] rounded-md"
            loading={joinLoading}
            onClick={() => joinMeeting(meetingID)}
          >
            {t("placeholder.joinMeeting")}
          </Button>
          {isHost ? (
            <Button
              type="text"
              className="w-[60%] rounded-md"
              onClick={() => updateStep(LaunchStep.Update, meetingInfo)}
            >
              {t("placeholder.changeMeetingDetail")}
            </Button>
          ) : null}
        </div>
      </div>
    );
  },
);
