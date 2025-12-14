import { Spin } from "antd";
import dayjs from "dayjs";
import i18n, { t } from "i18next";
import { memo, useEffect, useState } from "react";

import { useCreateImmediateMeeting, useGetMeetings } from "@/api/meeting";
import join_meeting from "@/assets/images/rtc/meeting_join.png";
import order_meeting from "@/assets/images/rtc/meeting_order.png";
import quick_meeting from "@/assets/images/rtc/meeting_quick.png";
import OIMAvatar from "@/components/OIMAvatar";
import { IMSDK } from "@/layout/MainContentWrap";
import { MeetingInfoSetting } from "@/pb/meeting.pb";
import { useUserStore } from "@/store";
import { checkIsMeeting } from "@/utils/childWindows";
import { emit, emitToSpecifiedWindow } from "@/utils/events";

import { LaunchStep } from "./data";

const actionList = [
  {
    icon: join_meeting,
    title: t("placeholder.joinMeeting"),
  },
  {
    icon: quick_meeting,
    title: t("placeholder.quickMeeting"),
  },
  {
    icon: order_meeting,
    title: t("placeholder.orderMeeting"),
  },
];

i18n.on("languageChanged", () => {
  actionList[0].title = t("placeholder.joinMeeting");
  actionList[1].title = t("placeholder.quickMeeting");
  actionList[2].title = t("placeholder.orderMeeting");
});

type IMeetingInfoSetting = MeetingInfoSetting & {
  hostFaceURL: string;
  hostNickname: string;
  startTime: number;
  duration: number;
};

type MeetingPrepareProps = {
  closeOverlay: () => void;
  updateStep: (step: LaunchStep, extraData?: unknown) => void;
};
export const MeetingPrepare = memo(
  ({ updateStep, closeOverlay }: MeetingPrepareProps) => {
    const [meetingList, setMeetingList] = useState<IMeetingInfoSetting[]>([]);
    const [loading, setLoading] = useState(false);

    const { mutate: createImmediateMeeting, isLoading: creating } =
      useCreateImmediateMeeting();
    const { mutate: getMeetings } = useGetMeetings();

    const selfUserID = useUserStore((state) => state.selfInfo.userID);

    useEffect(() => {
      if (!selfUserID) {
        return;
      }
      getMeetingRecords();
    }, [selfUserID]);

    const getMeetingRecords = () => {
      setLoading(true);
      getMeetings(
        {
          userID: useUserStore.getState().selfInfo.userID,
          status: ["Scheduled", "In-Progress"],
        },
        {
          onSuccess: async ({ data }) => {
            let meetingDetails = data.meetingDetails as IMeetingInfoSetting[];
            meetingDetails = (meetingDetails ?? []).filter((item) =>
              Boolean(item.info?.creatorDefinedMeeting?.hostUserID),
            );
            if (meetingDetails.length > 0) {
              const { data } = await IMSDK.getUsersInfo(
                meetingDetails.map(
                  (item) => item.info?.creatorDefinedMeeting?.hostUserID,
                ) as string[],
              );
              meetingDetails.map((meeting) => {
                const findUser = data.find(
                  (user: any) =>
                    user.userID === meeting.info?.creatorDefinedMeeting?.hostUserID,
                );
                meeting.hostFaceURL = findUser?.faceURL as string;
                meeting.startTime = meeting.info?.creatorDefinedMeeting
                  ?.scheduledTime as unknown as number;
                meeting.duration = meeting.info?.creatorDefinedMeeting
                  ?.meetingDuration as unknown as number;
              });
              setMeetingList(meetingDetails);
              console.log(meetingDetails);
            }
            setLoading(false);
          },
          onError() {
            setLoading(false);
          },
        },
      );
    };

    const actionClick = (idx: number) => {
      switch (idx) {
        case 0:
          updateStep(LaunchStep.Join);
          break;
        case 1: {
          const hasMeetingWindow = checkIsMeeting();
          if (hasMeetingWindow || creating) return;

          const params = {
            creatorUserID: useUserStore.getState().selfInfo.userID,
            creatorDefinedMeetingInfo: {
              title: "Meeting",
              scheduledTime: dayjs().unix(),
              meetingDuration: 3600,
              password: "",
            },
            setting: {
              canParticipantsEnableCamera: true,
              canParticipantsUnmuteMicrophone: true,
              canParticipantsShareScreen: true,
              disableCameraOnJoin: true,
              disableMicrophoneOnJoin: true,
            },
          };
          // @ts-ignore
          createImmediateMeeting(params, {
            onSuccess(data) {
              const meetingData = {
                liveURL: data.data.liveKit?.url as string,
                token: data.data.liveKit?.token as string,
                roomID: data.data.detail?.info?.systemGenerated?.meetingID as string,
              };
              if (window.electronAPI?.enableCLib) {
                emitToSpecifiedWindow("OPEN_MEETING_MODAL", meetingData);
                closeOverlay();
                return;
              }
              emit("OPEN_MEETING_MODAL", meetingData);
              closeOverlay();
            },
          });
          break;
        }
        case 2:
          updateStep(LaunchStep.Order);
          break;
        default:
          break;
      }
    };

    return (
      <>
        <div className="flex w-full justify-around border-b border-[var(--gap-text)] px-5.5 py-3">
          {actionList.map((action, idx) => (
            <Spin key={action.title} spinning={idx === 1 && creating}>
              <div
                className="flex cursor-pointer flex-col items-center text-xs"
                onClick={() => actionClick(idx)}
              >
                <img src={action.icon} alt="" width={50} className="mb-2.5" />
                <span>{action.title}</span>
              </div>
            </Spin>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          <Spin className="mt-2.5 w-full" wrapperClassName="h-full" spinning={loading}>
            <div className="h-full overflow-y-auto">
              {meetingList.map((item) => (
                <div
                  key={item.info?.systemGenerated?.meetingID}
                  className="flex items-center px-3.5 py-2.5 hover:bg-[var(--primary-active)]"
                  onClick={() =>
                    updateStep(LaunchStep.HistoryDisplay, {
                      ...item,
                      roomID: item.info?.systemGenerated?.meetingID,
                      startTime: dayjs(item.startTime * 1000),
                      duration: item.startTime + item.duration,
                    })
                  }
                >
                  <OIMAvatar
                    size={42}
                    src={item.hostFaceURL}
                    text={item.info?.systemGenerated?.creatorNickname}
                  />
                  <div className="ml-3 flex flex-col overflow-hidden">
                    <div className="flex">
                      <div className="truncate">
                        {item.info?.creatorDefinedMeeting?.title}
                      </div>
                      {Date.now() < item.startTime * 1000 ? (
                        <span className="ml-3 h-5 min-w-[44px] rounded bg-[#1E74DE] px-1 text-xs font-light leading-5 text-white">
                          {t("notStart")}
                        </span>
                      ) : Date.now() < (item.startTime + item.duration) * 1000 ? (
                        <span className="ml-3 h-5 min-w-[44px] rounded bg-[#FF9D3C] px-1 text-xs font-light leading-5 text-white">
                          {t("alreadyStarted")}
                        </span>
                      ) : null}
                    </div>
                    <div className="truncate text-xs text-[var(--sub-text)]">{`${dayjs(
                      item.startTime * 1000,
                    ).format("M-DD HH:mm")}-${dayjs(
                      (item.startTime + item.duration) * 1000,
                    ).format("HH:mm")} ${t("placeholder.launchPerson")}：${
                      item.info?.systemGenerated?.creatorNickname
                    }`}</div>
                  </div>
                </div>
              ))}
            </div>
          </Spin>
        </div>
      </>
    );
  },
);
