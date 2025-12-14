import {
  TrackToggle,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
} from "@livekit/components-react";
import { CbEvents } from "@openim/wasm-client-sdk";
import { SessionType } from "@openim/wasm-client-sdk";
import { RtcInvite, WSEvent } from "@openim/wasm-client-sdk/lib/types/entity";
import { useLatest } from "ahooks";
import { Spin } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import {
  ConnectionQuality,
  Participant,
  RemoteParticipant,
  RoomEvent,
  Track,
} from "livekit-client";
import { useEffect, useRef, useState } from "react";

import rtc_accept from "@/assets/images/rtc/rtc_accept.png";
import rtc_camera from "@/assets/images/rtc/rtc_camera.png";
import rtc_camera_off from "@/assets/images/rtc/rtc_camera_off.png";
import rtc_hungup from "@/assets/images/rtc/rtc_hungup.png";
import rtc_mic from "@/assets/images/rtc/rtc_mic.png";
import rtc_mic_off from "@/assets/images/rtc/rtc_mic_off.png";
import { RtcMessageStatus } from "@/constants";
import { IMSDK } from "@/layout/MainContentWrap";
import { ParticipantChange } from "@/pages/chat/queryChat/ChatHeader/GroupCallingCard";
import { feedbackToast } from "@/utils/common";
import { emitToSpecifiedWindow } from "@/utils/events";

import { CounterHandle, ForwardCounter } from "./Counter";
import { AuthData, ParticipantInfo } from "./data";
import { RequestCloseOverlayFn } from "./index";

interface IRtcControlProps {
  isWaiting: boolean;
  isRecv: boolean;
  isJoin?: boolean;
  isConnected: boolean;
  inviteFetching: boolean;
  showMini: boolean;
  selfID: string;
  invitation: RtcInvite;
  connectRtc: (data?: AuthData) => void;
  requestCloseOverlay: RequestCloseOverlayFn;
}
export const RtcControl = ({
  isWaiting,
  isRecv,
  isJoin,
  isConnected,
  inviteFetching,
  showMini,
  selfID,
  invitation,
  connectRtc,
  requestCloseOverlay,
}: IRtcControlProps) => {
  const room = useRoomContext();
  const localParticipantState = useLocalParticipant();
  const hasJoin = useRef(false);
  const lostFlag = useRef(false);
  const counterRef = useRef<CounterHandle>(null);
  const remotes = useRemoteParticipants({
    updateOnlyOn: [RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected],
  });
  const latestRemotes = useLatest(remotes);
  const [networkTips, setNetworkTips] = useState("");

  const isVideoCall = invitation.mediaType === "video";
  const isSingle = invitation?.sessionType === SessionType.Single;

  const inviteeUserIDList = useRef(
    invitation.inviteeUserIDList.filter((userID) => userID !== selfID),
  );
  const timeoutTimer = useRef<NodeJS.Timeout>();
  const connectedFlag = useRef(false);

  const [acceptLoading, setAcceptLoading] = useState(false);

  function innerRequestCloseOverlay(...args: Parameters<RequestCloseOverlayFn>) {
    // Remember clear timer to avoid insert an unexpected timeout-RtcMessage
    clearTimeout(timeoutTimer.current);
    requestCloseOverlay(...args);
  }

  useEffect(() => {
    if (!isRecv || isJoin || connectedFlag.current) return;

    if (isConnected) {
      clearTimeout(timeoutTimer.current);
      connectedFlag.current = true;
      return;
    }

    timeoutTimer.current = setTimeout(() => {
      if (!isConnected) {
        if (invitation.groupID) {
          IMSDK.signalingReject({
            opUserID: selfID,
            invitation,
          });
        } else {
          insertRtcMessage(RtcMessageStatus.Timeout);
        }
        innerRequestCloseOverlay("INVITE_TIMEOUT");
      }
    }, invitation.timeout * 1000);
  }, [isRecv, invitation.timeout, invitation.groupID, isConnected, selfID, isJoin]);

  useEffect(() => {
    const acceptHandler = ({
      data: {
        invitation: { roomID },
      },
    }: WSEvent<{ invitation: RtcInvite }>) => {
      if (window.electronAPI?.enableCLib) {
        IMSDK.infoLogs({
          msgs: "acceptHandler",
          keyAndValue: ["invitation and roomID", JSON.stringify([invitation, roomID])],
        });
      }
      if (invitation.roomID !== roomID) return;

      if (isSingle) {
        connectRtc();
      }
    };
    const rejectHandler = ({
      data: {
        invitation: { roomID },
        participant,
      },
    }: WSEvent<{ invitation: RtcInvite; participant: ParticipantInfo }>) => {
      if (window.electronAPI?.enableCLib) {
        IMSDK.infoLogs({
          msgs: "rejectHandler",
          keyAndValue: ["invitation and roomID", JSON.stringify([invitation, roomID])],
        });
      }
      if (invitation.roomID !== roomID) return;
      if (isSingle) {
        setTimeout(() => {
          insertRtcMessage(RtcMessageStatus.Refused);
          innerRequestCloseOverlay("REJECT_BY_INVITEE");
        });
        return;
      }
      inviteeUserIDList.current = inviteeUserIDList.current.filter(
        (userID) => userID !== participant.userInfo.userID,
      );
      if (inviteeUserIDList.current.length === 0) {
        innerRequestCloseOverlay("REJECT_BY_ALL_INVITEE");
      }
    };
    const hangupHandler = ({
      data: {
        invitation: { roomID },
      },
    }: WSEvent<{ invitation: RtcInvite }>) => {
      if (!isSingle || invitation.roomID !== roomID) return;

      insertRtcMessage(RtcMessageStatus.Successed);
      if (!isWaiting) {
        room.disconnect();
        innerRequestCloseOverlay("HANG_UP_BY_OTHERS");
      }
    };
    const timeoutHandler = ({
      data: {
        invitation: { roomID },
      },
    }: WSEvent<{ invitation: RtcInvite }>) => {
      if (window.electronAPI?.enableCLib) {
        IMSDK.infoLogs({
          msgs: "timeoutHandler",
          keyAndValue: ["invitation and roomID", JSON.stringify([invitation, roomID])],
        });
      }
      if (invitation.roomID !== roomID) return;

      if (isSingle) {
        insertRtcMessage(RtcMessageStatus.Timeout);
        innerRequestCloseOverlay("INVITE_TIMEOUT");
        return;
      }
      if (!hasJoin.current) {
        room.disconnect();
        innerRequestCloseOverlay("INVITE_TIMEOUT");
      }
    };
    const cancelHandler = ({
      data: {
        invitation: { roomID },
      },
    }: WSEvent<{ invitation: RtcInvite }>) => {
      if (window.electronAPI?.enableCLib) {
        IMSDK.infoLogs({
          msgs: "cancelHandler",
          keyAndValue: ["invitation and roomID", JSON.stringify([invitation, roomID])],
        });
      }
      if (invitation.roomID !== roomID) return;
      if (!isSingle && !isWaiting) return;
      insertRtcMessage(RtcMessageStatus.Canceled);
      innerRequestCloseOverlay("CANCEL_BY_OTHERS");
    };
    const participantConnectedHandler = (remoteParticipant: RemoteParticipant) => {
      if (window.electronAPI?.enableCLib) {
        IMSDK.infoLogs({
          msgs: "participantConnectedHandler",
          keyAndValue: [
            "invitation and remoteParticipant",
            JSON.stringify([invitation, remoteParticipant]),
          ],
        });
      }
      if (!isSingle) {
        hasJoin.current = true;
      }
    };
    const participantDisconnectedHandler = (remoteParticipant: RemoteParticipant) => {
      if (window.electronAPI?.enableCLib) {
        IMSDK.infoLogs({
          msgs: "participantDisconnectedHandler",
          keyAndValue: [
            "invitation and remoteParticipant",
            JSON.stringify([invitation, remoteParticipant]),
          ],
        });
      }
      if (!isSingle) {
        setTimeout(() => {
          if (latestRemotes.current && latestRemotes.current.length === 0) {
            room.disconnect();
            innerRequestCloseOverlay("PARTICIPANT_UNKNOWN_DISCONNECTED");
          }
        });
        return;
      }

      const identity = remoteParticipant.identity;
      if (
        lostFlag.current &&
        (identity === invitation.inviterUserID ||
          identity === invitation.inviteeUserIDList[0])
      ) {
        insertRtcMessage(RtcMessageStatus.Interrupt);
        room.disconnect();
        innerRequestCloseOverlay("PARTICIPANT_UNKNOWN_DISCONNECTED");
      }
    };
    const handleByOtherDevice = ({
      data: {
        invitation: { roomID },
      },
    }: WSEvent<{ invitation: RtcInvite }>) => {
      if (window.electronAPI?.enableCLib) {
        IMSDK.infoLogs({
          msgs: "handleByOtherDevice",
          keyAndValue: ["invitation and roomID", JSON.stringify([invitation, roomID])],
        });
      }
      if (invitation.roomID !== roomID) return;
      insertRtcMessage(RtcMessageStatus.HandleByOtherDevice);
      innerRequestCloseOverlay("HANDLE_IN_OTHER_DEVICE");
    };
    const roomParticipantChange = ({ data }: { data: ParticipantChange }) => {
      if (data.groupID === invitation.roomID && !data.participant?.length) {
        innerRequestCloseOverlay("ALL_GROUP_PARTICIPANT_LEAVE");
      }
    };
    const connectQualityChangeHandler = (
      quality: ConnectionQuality,
      participant: Participant,
    ) => {
      if (!isSingle) return;
      const isLocal = participant.identity === selfID;
      if (quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost) {
        if (quality === ConnectionQuality.Lost) {
          lostFlag.current = true;
        }
        setNetworkTips(t(isLocal ? "toast.networkPoor" : "toast.remoteNetworkPoor"));
      } else {
        setNetworkTips("");
      }
    };

    IMSDK.on(CbEvents.OnInviteeAccepted, acceptHandler);
    IMSDK.on(CbEvents.OnInviteeRejected, rejectHandler);
    IMSDK.on(CbEvents.OnHangUp, hangupHandler);
    IMSDK.on(CbEvents.OnInvitationCancelled, cancelHandler);
    IMSDK.on(CbEvents.OnInvitationTimeout, timeoutHandler);
    IMSDK.on(CbEvents.OnInviteeAcceptedByOtherDevice, handleByOtherDevice);
    IMSDK.on(CbEvents.OnInviteeRejectedByOtherDevice, handleByOtherDevice);
    IMSDK.on(CbEvents.OnRoomParticipantDisconnected, roomParticipantChange);
    room.on(RoomEvent.ParticipantConnected, participantConnectedHandler);
    room.on(RoomEvent.ParticipantDisconnected, participantDisconnectedHandler);
    room.on(RoomEvent.ConnectionQualityChanged, connectQualityChangeHandler);
    return () => {
      IMSDK.off(CbEvents.OnInviteeAccepted, acceptHandler);
      IMSDK.off(CbEvents.OnInviteeRejected, rejectHandler);
      IMSDK.off(CbEvents.OnHangUp, hangupHandler);
      IMSDK.off(CbEvents.OnInvitationCancelled, cancelHandler);
      IMSDK.off(CbEvents.OnInvitationTimeout, timeoutHandler);
      IMSDK.off(CbEvents.OnInviteeAcceptedByOtherDevice, handleByOtherDevice);
      IMSDK.off(CbEvents.OnInviteeRejectedByOtherDevice, handleByOtherDevice);
      IMSDK.off(CbEvents.OnRoomParticipantDisconnected, roomParticipantChange);
      room.off(RoomEvent.ParticipantConnected, participantConnectedHandler);
      room.off(RoomEvent.ParticipantDisconnected, participantDisconnectedHandler);
      room.off(RoomEvent.ConnectionQualityChanged, connectQualityChangeHandler);
      hasJoin.current = false;
    };
  }, [isSingle, room, invitation.roomID, isWaiting, selfID]);

  const disconnect = () => {
    const data = {
      opUserID: selfID,
      invitation,
    };
    clearTimeout(timeoutTimer.current);
    if (isWaiting) {
      const funcName = isRecv ? "signalingReject" : "signalingCancel";
      IMSDK[funcName](data);
      insertRtcMessage(isRecv ? RtcMessageStatus.Refused : RtcMessageStatus.Canceled);
      innerRequestCloseOverlay("CANCEL_BY_ME");
      return;
    }
    IMSDK.signalingHungUp(data);
    insertRtcMessage(RtcMessageStatus.Successed);
    room.disconnect();
    innerRequestCloseOverlay("HANG_UP_BY_ME");
  };

  const acceptInvitation = async () => {
    setAcceptLoading(true);
    try {
      const { data } = await IMSDK.signalingAccept({
        opUserID: selfID,
        invitation,
      });
      connectRtc(data);
    } catch (error) {
      feedbackToast({ msg: t("toast.byInviteUserFailed"), error });
      innerRequestCloseOverlay("SIGNALING_ACCEPT_FAILED");
    }
    setAcceptLoading(false);
    clearTimeout(timeoutTimer.current);
  };

  const insertRtcMessage = (status: RtcMessageStatus) => {
    emitToSpecifiedWindow("INSERT_RTC_MESSAGE", {
      status,
      duration: counterRef.current?.getTimeStr() ?? "",
      invitation,
    });
  };

  return (
    <div className="ignore-drag absolute bottom-[6%] z-10 flex justify-center">
      <div
        className={clsx("absolute -top-9 -translate-y-full text-xs text-white", {
          invisible: showMini,
        })}
      >
        {networkTips}
      </div>
      {!isWaiting && (
        <ForwardCounter
          ref={counterRef}
          className={clsx("absolute -top-8", { invisible: showMini })}
          isConnected={isConnected}
        />
      )}
      {!showMini && (
        <>
          {!isWaiting && (
            <TrackToggle
              className="app-no-drag flex cursor-pointer flex-col items-center !justify-start !gap-0 !p-0"
              source={Track.Source.Microphone}
              showIcon={false}
            >
              <img
                width={48}
                src={localParticipantState.isMicrophoneEnabled ? rtc_mic : rtc_mic_off}
                alt=""
              />
              <span className="mt-2 text-xs text-white">
                {t("placeholder.microphone")}
              </span>
            </TrackToggle>
          )}
          {inviteFetching ? (
            <div className="mb-6">
              <Spin />
            </div>
          ) : (
            <div
              className={clsx(
                "app-no-drag ml-12 flex cursor-pointer flex-col items-center",
                {
                  "mr-12": isVideoCall,
                  "!mx-0": !isRecv && isWaiting,
                },
              )}
              onClick={disconnect}
            >
              <img width={48} src={rtc_hungup} alt="" />
              <span
                className={clsx("mt-2 text-xs text-white", {
                  "!text-[var(--sub-text)]": isWaiting,
                })}
              >
                {isWaiting ? t("cancel") : t("hangUp")}
              </span>
            </div>
          )}
          {isRecv && isWaiting && (
            <Spin spinning={acceptLoading}>
              <div
                className="app-no-drag mx-12 flex cursor-pointer flex-col items-center"
                onClick={acceptInvitation}
              >
                <img width={48} src={rtc_accept} alt="" />
                <span
                  className={clsx("mt-2 text-xs text-white", {
                    "!text-[var(--sub-text)]": isWaiting,
                  })}
                >
                  {t("answer")}
                </span>
              </div>
            </Spin>
          )}
          {!isWaiting && isVideoCall && (
            <TrackToggle
              className="app-no-drag flex cursor-pointer flex-col items-center justify-start !gap-0 !p-0"
              source={Track.Source.Camera}
              showIcon={false}
            >
              <img
                width={48}
                src={
                  localParticipantState.isCameraEnabled ? rtc_camera : rtc_camera_off
                }
                alt=""
              />
              <span className="mt-2 text-xs text-white">{t("placeholder.camera")}</span>
            </TrackToggle>
          )}
        </>
      )}
    </div>
  );
};
