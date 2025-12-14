import { useParticipants, useTracks } from "@livekit/components-react";
import { useSize } from "ahooks";
import { Popover } from "antd";
import clsx from "clsx";
import dayjs from "dayjs";
import { t } from "i18next";
import { RoomEvent, Track } from "livekit-client";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import meeting_details from "@/assets/images/rtc/meeting_details.png";
import { MeetingMetadata } from "@/pb/meeting.pb";

import { secondsToTime } from "../data";
import { AllInOneVideoGrid } from "./AllInOneVideoGrid";
import { MeetingActionRow } from "./MeetingActionRow";
import { NomalVideoGrid } from "./NomalVideoGrid";

type MeetingMainProps = {
  roomID: string;
  showMax: boolean;
  showSlider: boolean;
  isConnected: boolean;
  meetingDetails: MeetingMetadata;
  windowActions: React.ReactNode;
  updateShowSlider: () => void;
  disconnect: (closeRoom?: boolean) => Promise<void>;
};

export type MeetingMainHandler = {
  focusUserID?: string;
  toggleAllInOne: (identity: string) => void;
};

const MeetingMain: ForwardRefRenderFunction<MeetingMainHandler, MeetingMainProps> = (
  {
    roomID,
    showSlider,
    showMax,
    isConnected,
    meetingDetails,
    windowActions,
    updateShowSlider,
    disconnect,
  },
  ref,
) => {
  const [focusUserID, setFocusUserID] = useState<string>();
  const wrapRef = useRef(null);
  const size = useSize(wrapRef);

  const participantLength = useParticipants({
    updateOnlyOn: [RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected],
  }).length;
  const isOnlyAudio =
    useTracks([Track.Source.Camera, Track.Source.ScreenShare]).length === 0;

  useEffect(() => {
    setFocusUserID(meetingDetails.personalData?.[0].userID);
  }, [meetingDetails.personalData]);

  const detailsContent = useMemo(
    () => (
      <div className="ignore-drag p-2.5">
        <div className="mb-2.5">
          {meetingDetails.detail?.info?.creatorDefinedMeeting?.title}
        </div>
        <div className="mb-2.5 text-xs text-[var(--sub-text)]">{`${t(
          "placeholder.meetingID",
        )}：${meetingDetails.detail?.info?.systemGenerated?.meetingID}`}</div>
        <div className="mb-2.5 text-xs text-[var(--sub-text)]">{`${t(
          "time.startTime",
        )}： ${dayjs
          .unix(
            meetingDetails.detail?.info?.systemGenerated
              ?.startTime as unknown as number,
          )
          .format("YYYY-MM-DD HH:mm")}`}</div>
        <div className="text-xs text-[var(--sub-text)]">{`${t(
          "placeholder.meetingTime",
        )}： ${
          // @ts-ignore
          secondsToTime[
            meetingDetails.detail?.info?.creatorDefinedMeeting
              ?.meetingDuration as unknown as number
          ] ?? ""
        }`}</div>
      </div>
    ),
    [
      meetingDetails.detail?.info?.systemGenerated?.meetingID,
      meetingDetails.detail?.info?.creatorDefinedMeeting?.title,
      meetingDetails.detail?.info?.creatorDefinedMeeting?.meetingDuration,
    ],
  );

  const toggleAllInOne = useCallback((identity: string) => {
    setFocusUserID(identity);
  }, []);

  useImperativeHandle(ref, () => ({
    focusUserID,
    toggleAllInOne,
  }));

  const mainWidth =
    showMax || window.electronAPI?.enableCLib
      ? `calc(100vw - ${showSlider ? 327 : 0}px - ${
          window.electronAPI?.enableCLib ? 0 : 40
        }px)`
      : "960px";
  const mainHeight =
    showMax || window.electronAPI?.enableCLib
      ? `calc(100vh - ${window.electronAPI?.enableCLib ? 0 : 40}px)`
      : "650px";

  return (
    <div
      className={clsx("flex max-h-[85vh] flex-col", {
        "max-h-full": window.electronAPI?.enableCLib,
      })}
      style={{ width: mainWidth, height: mainHeight }}
    >
      <div className="app-drag mx-auto flex h-7 w-full items-center justify-between px-3 leading-7">
        <div></div>
        <span>{t("placeholder.meeting")}</span>
        {windowActions}
      </div>
      <div className="ignore-drag flex justify-between bg-[rgba(24,144,255,0.05)] px-3 py-1">
        <div>{meetingDetails.detail?.info?.creatorDefinedMeeting?.title}</div>
        <Counter />
        <div className="flex items-center">
          <span>{t("placeholder.someInMeeting", { count: participantLength })}</span>
          <Popover
            content={detailsContent}
            trigger="click"
            placement="bottomRight"
            // arrow={false}
          >
            <img
              width={14}
              src={meeting_details}
              alt=""
              className="ml-2 cursor-pointer"
            />
          </Popover>
        </div>
      </div>
      <div
        className="ignore-drag relative flex flex-1 overflow-hidden"
        style={{
          backgroundColor: !isOnlyAudio && focusUserID ? "#343030" : "#fff",
        }}
        ref={wrapRef}
      >
        {focusUserID && !isOnlyAudio ? (
          <AllInOneVideoGrid
            hostUserID={
              meetingDetails.detail?.info?.creatorDefinedMeeting?.hostUserID as string
            }
            allInOneUserID={focusUserID}
            toggleAllInOne={toggleAllInOne}
          />
        ) : (
          <NomalVideoGrid
            isOnlyAudio={isOnlyAudio}
            hostUserID={
              meetingDetails.detail?.info?.creatorDefinedMeeting?.hostUserID as string
            }
            wrapHeight={size?.height}
            toggleAllInOne={toggleAllInOne}
          />
        )}
      </div>
      <MeetingActionRow
        roomID={roomID}
        isConnected={isConnected}
        meetingDetails={meetingDetails}
        updateShowSlider={updateShowSlider}
        disconnect={disconnect}
      />
    </div>
  );
};

export const ForwardMeetingMain = memo(forwardRef(MeetingMain));

const Counter = memo(() => {
  const [time, setTime] = useState(dayjs().format("YYYY-MM-DD HH:mm:ss"));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(dayjs().format("YYYY-MM-DD HH:mm:ss"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <div>{time}</div>;
});
