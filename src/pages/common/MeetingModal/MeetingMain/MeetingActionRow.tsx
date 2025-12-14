import { CloseOutlined } from "@ant-design/icons";
import { useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Button, Popover, Spin, Switch } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import { RoomEvent, Track } from "livekit-client";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { message, modal } from "@/AntdGlobalComp";
import { useUpdateMeeting } from "@/api/meeting";
import meeting_member from "@/assets/images/rtc/meeting_member.png";
import meeting_setting from "@/assets/images/rtc/meeting_setting.png";
import meeting_toggle_camera from "@/assets/images/rtc/meeting_toggle_camera.png";
import meeting_toggle_camera_off from "@/assets/images/rtc/meeting_toggle_camera_off.png";
import meeting_toggle_mic from "@/assets/images/rtc/meeting_toggle_mic.png";
import meeting_toggle_mic_off from "@/assets/images/rtc/meeting_toggle_mic_off.png";
import meeting_toggle_screen from "@/assets/images/rtc/meeting_toggle_screen.png";
import meeting_toggle_screen_off from "@/assets/images/rtc/meeting_toggle_screen_off.png";
import {
  decodeNotifyMeetingData,
  MeetingMetadata,
  MeetingSetting,
} from "@/pb/meeting.pb";
import { useUserStore } from "@/store";

import { CloseMeetingContent } from "..";
import styles from "./meeting-main.module.scss";

type MeetingActionRowProps = {
  roomID: string;
  isConnected: boolean;
  meetingDetails: MeetingMetadata;
  updateShowSlider: () => void;
  disconnect: (closeRoom?: boolean) => Promise<void>;
};
export const MeetingActionRow = memo(
  ({
    roomID,
    isConnected,
    meetingDetails,
    updateShowSlider,
    disconnect,
  }: MeetingActionRowProps) => {
    const [showSetting, setShowSetting] = useState(false);
    const room = useRoomContext();

    const selfUserID = useUserStore((state) => state.selfInfo.userID);

    const localParticipantState = useLocalParticipant();
    const localParticipant = localParticipantState.localParticipant;

    useEffect(() => {
      const streamChangeHandler = (payload: Uint8Array) => {
        const data = decodeNotifyMeetingData(payload);
        data.streamOperateData?.operation?.map((item) => {
          if (
            selfUserID !==
              meetingDetails.detail?.info?.creatorDefinedMeeting?.hostUserID &&
            item.userID === selfUserID
          ) {
            if (item.cameraOnEntry) {
              if (item.cameraOnEntry.value) {
                modal.confirm({
                  title: t("toast.hint"),
                  content: t("toast.requestCamera"),
                  onOk: () => {
                    operateCamera(Boolean(item.cameraOnEntry!.value));
                  },
                });
              } else {
                operateCamera(Boolean(item.cameraOnEntry.value));
              }
            }
            if (item.microphoneOnEntry) {
              if (item.microphoneOnEntry.value) {
                modal.confirm({
                  title: t("toast.hint"),
                  content: t("toast.requestMicrophone"),
                  onOk: () => {
                    operateMicrophone(Boolean(item.microphoneOnEntry!.value));
                  },
                });
              } else {
                operateMicrophone(Boolean(item.microphoneOnEntry.value));
              }
            }
          }
        });
      };
      room.on(RoomEvent.DataReceived, streamChangeHandler);
      return () => {
        room.off(RoomEvent.DataReceived, streamChangeHandler);
      };
    }, [meetingDetails.detail?.info?.systemGenerated?.meetingID, selfUserID]);

    const isHost = useMemo(
      () =>
        meetingDetails.detail?.info?.creatorDefinedMeeting?.hostUserID === selfUserID,
      [meetingDetails.detail?.info?.creatorDefinedMeeting?.hostUserID, selfUserID],
    );

    const actionArr = useMemo(
      () => [
        {
          title: `${
            localParticipantState.isMicrophoneEnabled ? t("close") : t("open")
          }${t("placeholder.microphone")}`,
          icon: localParticipantState.isMicrophoneEnabled
            ? meeting_toggle_mic
            : meeting_toggle_mic_off,
        },
        {
          title: `${localParticipantState.isCameraEnabled ? t("close") : t("open")}${t(
            "placeholder.camera",
          )}`,
          icon: localParticipantState.isCameraEnabled
            ? meeting_toggle_camera
            : meeting_toggle_camera_off,
        },
        {
          title: localParticipantState.isScreenShareEnabled
            ? t("placeholder.endSharing")
            : t("placeholder.sharedScreen"),
          icon: localParticipantState.isScreenShareEnabled
            ? meeting_toggle_screen
            : meeting_toggle_screen_off,
        },
        {
          title: t("placeholder.member"),
          icon: meeting_member,
        },
        {
          title: t("placeholder.setting"),
          icon: meeting_setting,
          hidden: !isHost,
        },
      ],
      [
        localParticipantState.isCameraEnabled,
        localParticipantState.isMicrophoneEnabled,
        localParticipantState.isScreenShareEnabled,
        isHost,
      ],
    );

    const updateShowSetting = useCallback(() => {
      setShowSetting((show) => !show);
    }, []);

    const actionClick = async (idx: number) => {
      if (!isConnected) {
        message.warning(t("toast.meetingOver"));
        return;
      }
      switch (idx) {
        case 0:
          if (
            !isHost &&
            !meetingDetails.detail?.setting?.canParticipantsUnmuteMicrophone &&
            !localParticipantState.isMicrophoneEnabled
          ) {
            message.warning(t("toast.adminCloseMicrophone"));
            return;
          }
          await operateMicrophone();
          break;
        case 1:
          if (
            !isHost &&
            !meetingDetails.detail?.setting?.canParticipantsEnableCamera &&
            !localParticipantState.isCameraEnabled
          ) {
            message.warning(t("toast.adminCloseCamera"));
            return;
          }
          await operateCamera();
          break;
        case 2:
          if (
            !isHost &&
            !meetingDetails.detail?.setting?.canParticipantsShareScreen &&
            !localParticipantState.isScreenShareEnabled
          ) {
            message.warning(t("toast.onlyHostShareScreen"));
            return;
          }
          await operateScreenShare();
          break;
        case 3:
          updateShowSlider();
          break;
        default:
          break;
      }
    };

    const operateCamera = async (flag?: boolean) => {
      if (localParticipant) {
        const enable = flag ?? !localParticipantState.isCameraEnabled;
        await localParticipant.setCameraEnabled(enable);
      }
    };

    const operateMicrophone = async (flag?: boolean) => {
      if (localParticipant) {
        const enable = flag ?? !localParticipantState.isMicrophoneEnabled;
        await localParticipant.setMicrophoneEnabled(enable);
      }
    };

    const operateScreenShare = async () => {
      if (localParticipant) {
        const enable = localParticipantState.isScreenShareEnabled;
        if (!window.electronAPI) {
          await localParticipant.setScreenShareEnabled(!enable);
          return;
        }

        // for electron
        if (enable) {
          const track = localParticipant.getTrackPublication(
            Track.Source.ScreenShare,
          )?.track;
          if (track) {
            await localParticipant.unpublishTrack(track);
          }
          return;
        }
        try {
          const screenSourceID = await window.electronAPI.getScreenSource();
          if (!screenSourceID) {
            throw new Error(t("toast.sharedScreenFailed"));
          }
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              // @ts-ignore
              mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: screenSourceID,
                width: 1920,
                height: 1080,
              },
            },
          });
          localParticipant.publishTrack(stream.getVideoTracks()[0], {
            simulcast: true,
            source: Track.Source.ScreenShare,
          });
        } catch (error) {
          message.error(t("toast.sharedScreenFailed"));
          console.error(error);
        }
      }
    };

    return (
      <div className={clsx("flex items-center justify-between", styles["row-shadow"])}>
        <div className="flex h-16">
          {!isConnected
            ? null
            : actionArr.map((action, idx) => {
                if (action.hidden) return null;
                const Wrapper = (actionEl: JSX.Element) =>
                  idx === 4 ? (
                    <Popover
                      key={action.title}
                      open={showSetting}
                      onOpenChange={(vis) => setShowSetting(vis)}
                      content={
                        <SettingContent
                          roomID={roomID}
                          meetingDetails={meetingDetails}
                          updateShowSetting={updateShowSetting}
                        />
                      }
                      placement="top"
                      trigger="click"
                    >
                      {actionEl}
                    </Popover>
                  ) : (
                    actionEl
                  );
                return Wrapper(
                  <div
                    key={action.title}
                    className="mx-3 my-2 flex min-w-[72px] cursor-pointer flex-col items-center text-xs"
                    onClick={() => actionClick(idx)}
                  >
                    <img width={32} src={action.icon} alt="" />
                    <div>{action.title}</div>
                  </div>,
                );
              })}
        </div>
        <Popover
          open={isHost ? undefined : false}
          content={<CloseMeetingContent disconnect={disconnect} />}
          trigger="click"
          placement="topRight"
        >
          <Button
            className="mr-3 rounded"
            type="primary"
            onClick={() => {
              if (!isHost) {
                disconnect();
              }
            }}
          >
            {isHost ? t("placeholder.finishMeeting") : t("placeholder.leaveMeeting")}
          </Button>
        </Popover>
      </div>
    );
  },
);

type SettingContentProps = {
  roomID: string;
  meetingDetails: MeetingMetadata;
  updateShowSetting: () => void;
};
const SettingContent = memo(
  ({ roomID, meetingDetails, updateShowSetting }: SettingContentProps) => {
    const { mutate: updateMeeting, isLoading } = useUpdateMeeting();

    const settingList = useMemo(
      () => [
        {
          title: t("placeholder.participantCanUnmuteSelf"),
          value: meetingDetails.detail?.setting?.canParticipantsUnmuteMicrophone,
        },
        {
          title: t("placeholder.participantCanEnableVideo"),
          value: meetingDetails.detail?.setting?.canParticipantsEnableCamera,
        },
        {
          title: t("placeholder.onlyHostShareScreen"),
          value: !meetingDetails.detail?.setting?.canParticipantsShareScreen,
        },
        // {
        //   title: t("placeholder.onlyHostInviteUser"),
        //   value: meetingDetails.onlyHostInviteUser,
        // },
        {
          title: t("placeholder.joinDisableMicrophone"),
          value: meetingDetails.detail?.setting?.disableMicrophoneOnJoin,
        },
      ],
      [
        meetingDetails.detail?.setting?.canParticipantsUnmuteMicrophone,
        meetingDetails.detail?.setting?.canParticipantsEnableCamera,
        meetingDetails.detail?.setting?.canParticipantsShareScreen,
        // meetingDetails.onlyHostInviteUser,
        meetingDetails.detail?.setting?.disableMicrophoneOnJoin,
      ],
    );

    const roomSettingUpdate = (flag: boolean, idx: number) => {
      const options = {} as MeetingSetting;
      switch (idx) {
        case 0:
          options.canParticipantsUnmuteMicrophone = flag;
          break;
        case 1:
          options.canParticipantsEnableCamera = flag;
          break;
        case 2:
          options.canParticipantsShareScreen = !flag;
          break;
        // case 3:
        //   options.onlyHostInviteUser = flag;
        //   break;
        case 3:
          options.disableMicrophoneOnJoin = flag;
          break;
        default:
          break;
      }
      // @ts-ignore
      updateMeeting({
        meetingID: roomID,
        ...options,
      });
    };

    return (
      <Spin spinning={isLoading}>
        <div className="w-[480px]">
          <div className="flex items-center justify-between bg-[#f1f2f3] px-6 py-4">
            <div>{t("placeholder.meetingSetting")}</div>
            <CloseOutlined
              className="cursor-pointer text-[#a5abb8]"
              onClick={updateShowSetting}
            />
          </div>
          {settingList.map((setting, idx) => (
            <div
              key={setting.title}
              className="flex items-center justify-between px-6 py-4"
            >
              <div>{setting.title}</div>
              <Switch
                checked={setting.value}
                size="small"
                onClick={(v) => roomSettingUpdate(v, idx)}
              />
            </div>
          ))}
        </div>
      </Spin>
    );
  },
);
