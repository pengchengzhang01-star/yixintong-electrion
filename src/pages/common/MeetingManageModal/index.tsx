import { CloseOutlined, LeftOutlined } from "@ant-design/icons";
import i18n, { t } from "i18next";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import { useEndMeeting, useJoinMeeting } from "@/api/meeting";
import meeting_delete from "@/assets/images/rtc/meeting_delete.png";
import meeting_share from "@/assets/images/rtc/meeting_share.png";
import DraggableModalWrap from "@/components/DraggableModalWrap";
import { CustomMessageType } from "@/constants";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { MeetingInfoSetting } from "@/pb/meeting.pb";
import { useUserStore } from "@/store";
import { checkIsMeeting } from "@/utils/childWindows";
import { emit, emitToSpecifiedWindow } from "@/utils/events";

import { displayTypes, LaunchStep, notBackTypes } from "./data";
import { MeetingDisplay } from "./MeetingDisplay";
import { MeetingPrepare } from "./MeetingPrepare";
import { OrderOrJoinMeeting } from "./OrderOrJoinMeeting";

const MeetingManageModal: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const ignoreClasses = `.ant-form, .ignore-drag, .cursor-pointer`;

  return (
    <DraggableModalWrap
      className={"no-padding-modal meeting-manage-modal"}
      ignoreClasses={ignoreClasses}
      destroyOnClose
      closable={false}
      footer={null}
      mask={false}
      width={420}
      centered
      open={isOverlayOpen}
      onCancel={closeOverlay}
      title={null}
    >
      <MeetingManageContent closeOverlay={closeOverlay} />
    </DraggableModalWrap>
  );
};

export default memo(forwardRef(MeetingManageModal));

export const MeetingManageContent = memo(
  ({ closeOverlay }: { closeOverlay: () => void }) => {
    const [step, setStep] = useState(LaunchStep.Prepare);
    const [newMeetingInfo, setNewMeetingInfo] = useState<MeetingInfoSetting>(
      {} as MeetingInfoSetting,
    );
    const selfInfo = useUserStore((state) => state.selfInfo);
    const [joinLoading, setJoinLoading] = useState(false);

    const { mutate: joinMeetingApi } = useJoinMeeting();
    const { mutate: endMeeting } = useEndMeeting();

    const updateStep = useCallback((next: LaunchStep, extraData?: unknown) => {
      if (extraData) {
        setNewMeetingInfo(extraData as MeetingInfoSetting);
      }
      setStep(next);
    }, []);

    const joinMeeting = useCallback((roomID: string) => {
      const hasMeetingWindow = checkIsMeeting();
      if (hasMeetingWindow) return;
      setJoinLoading(true);
      const params = {
        meetingID: roomID,
        userID: useUserStore.getState().selfInfo.userID,
        password: "",
      };
      joinMeetingApi(params, {
        onSuccess(data) {
          const meetingData = {
            liveURL: data.data.liveKit?.url as string,
            token: data.data.liveKit?.token as string,
            roomID,
          };
          if (window.electronAPI?.enableCLib) {
            emitToSpecifiedWindow("OPEN_MEETING_MODAL", meetingData);
            closeOverlay();
            return;
          }
          emit("OPEN_MEETING_MODAL", meetingData);
          closeOverlay();
        },
        onSettled() {
          setJoinLoading(false);
        },
      });
    }, []);

    const inviteMember = () => {
      const meetingInfo = {
        inviterFaceURL: selfInfo.faceURL,
        id: newMeetingInfo.info?.systemGenerated?.meetingID,
        duration: newMeetingInfo.info?.creatorDefinedMeeting?.meetingDuration,
        inviterNickname: selfInfo.nickname,
        inviterUserID: selfInfo.userID,
        subject: newMeetingInfo.info?.creatorDefinedMeeting?.title,
        start: newMeetingInfo.info?.systemGenerated?.startTime,
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

    const back = () => {
      setStep(LaunchStep.Prepare);
    };

    const deleteMeeting = () => {
      const params = {
        meetingID: newMeetingInfo?.info?.systemGenerated?.meetingID,
        userID: useUserStore.getState().selfInfo.userID,
      };
      endMeeting(params, {
        onSuccess() {
          back();
        },
      });
    };

    const MainRender = useMemo(() => {
      switch (step) {
        case LaunchStep.Prepare:
          return <MeetingPrepare closeOverlay={closeOverlay} updateStep={updateStep} />;
        case LaunchStep.Order:
          return <OrderOrJoinMeeting isLaunch={true} updateStep={updateStep} />;
        case LaunchStep.Join:
          return (
            <OrderOrJoinMeeting joinMeeting={joinMeeting} joinLoading={joinLoading} />
          );
        case LaunchStep.Display:
        case LaunchStep.HistoryDisplay:
          return (
            <MeetingDisplay
              meetingInfo={newMeetingInfo}
              isHost={
                newMeetingInfo?.info?.systemGenerated?.creatorUserID === selfInfo.userID
              }
              joinLoading={joinLoading}
              updateStep={updateStep}
              joinMeeting={joinMeeting}
            />
          );
        case LaunchStep.Update:
          return (
            <OrderOrJoinMeeting
              isLaunch={true}
              updateStep={updateStep}
              meetingInfo={newMeetingInfo}
            />
          );
        default:
          return null;
      }
    }, [step, newMeetingInfo]);

    const modalTitle = useMemo(() => {
      switch (step) {
        case LaunchStep.Prepare:
          return t("placeholder.meeting");
        case LaunchStep.Join:
          return t("placeholder.joinMeeting");
        case LaunchStep.Order:
          return t("placeholder.orderMeeting");
        case LaunchStep.Display:
          return t("placeholder.orderSuccess");
        case LaunchStep.HistoryDisplay:
          return t("placeholder.meetingDetail");
        case LaunchStep.Update:
          return t("placeholder.changeMeetingDetail");
        default:
          return "";
      }
    }, [step, i18n.language]);

    const canShare = displayTypes.includes(step) && !window.electronAPI?.enableCLib;
    const canDelete =
      displayTypes.includes(step) &&
      newMeetingInfo?.info?.creatorDefinedMeeting?.hostUserID === selfInfo.userID;

    return (
      <div className="flex h-[550px] flex-col">
        <div className="app-drag relative my-3 w-full text-center">
          <span>{modalTitle}</span>
          <div className="app-no-drag text-[var(--sub-text)]] absolute -top-1 right-3 flex items-center">
            {canShare ? (
              <img
                width={14}
                src={meeting_share}
                alt=""
                onClick={inviteMember}
                className="cursor-pointer"
              />
            ) : null}
            {canDelete ? (
              <img
                className="ml-3 cursor-pointer"
                width={14}
                src={meeting_delete}
                alt=""
                onClick={deleteMeeting}
              />
            ) : null}
            {!displayTypes.includes(step) ? (
              <CloseOutlined onClick={closeOverlay} className="cursor-pointer" />
            ) : null}
          </div>
          {!notBackTypes.includes(step) ? (
            <div
              className="app-no-drag text-[var(--sub-text)]] absolute left-3 top-0 flex cursor-pointer items-center"
              onClick={back}
            >
              <LeftOutlined className="mr-1" />
              <span className="text-xs">{t("placeholder.getBack")}</span>
            </div>
          ) : null}
        </div>
        {MainRender}
      </div>
    );
  },
);
