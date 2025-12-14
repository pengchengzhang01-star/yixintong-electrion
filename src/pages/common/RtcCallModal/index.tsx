import "@livekit/components-styles";
import "./index.scss";

import { LiveKitRoom } from "@livekit/components-react";
import { MessageReceiveOptType, SessionType } from "@openim/wasm-client-sdk";
import { useRequest } from "ahooks";
import { t } from "i18next";
import {
  FC,
  forwardRef,
  ForwardRefRenderFunction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import beCalled from "@/assets/audio/beCalled.mp3";
import DraggableModalWrap from "@/components/DraggableModalWrap";
import { RtcMessageStatus } from "@/constants";
import { useMediaAvailability } from "@/hooks/useMediaAvailability";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import { emitToSpecifiedWindow } from "@/utils/events";

import { AuthData, InviteData } from "./data";
import { RtcLayout } from "./RtcLayout";

interface IRtcCallModalProps {
  inviteData: InviteData;
  isRecv: boolean;
}

const RtcCallModal: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  IRtcCallModalProps
> = ({ inviteData, isRecv }, ref) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const selfID = useUserStore((state) => state.selfInfo?.userID);

  return (
    <DraggableModalWrap
      title={null}
      footer={null}
      open={isOverlayOpen}
      closable={false}
      maskClosable={false}
      keyboard={false}
      mask={false}
      centered
      width="auto"
      onCancel={closeOverlay}
      destroyOnClose
      ignoreClasses=".ignore-drag, .no-padding-modal, .cursor-pointer"
      className="no-padding-modal rtc-single-modal"
      wrapClassName="pointer-events-none"
    >
      <RtcCallContent
        inviteData={inviteData}
        isRecv={isRecv}
        selfID={selfID}
        isOverlayOpen={isOverlayOpen}
        closeOverlay={closeOverlay}
      />
    </DraggableModalWrap>
  );
};

export default forwardRef(RtcCallModal);

// The smaller the value, the higher the priority
const closeReasonPriority = {
  JOIN_FAILED: 1, // Failed to join RTC room
  SIGNALING_FAILED: 1, // Failed to initiate RTC signaling
  SIGNALING_ACCEPT_FAILED: 1, // Failed to accept RTC signaling
  INVITE_TIMEOUT: 1, // Call invitation timed out
  REJECT_BY_INVITEE: 1, // One-on-one: invitee rejected
  REJECT_BY_ALL_INVITEE: 1, // Group call: all invitees rejected
  CANCEL_BY_OTHERS: 1, // Local invitee received inviter-canceled invitation
  CANCEL_BY_ME: 1, // Local inviter canceled before invitee answered
  HANDLE_IN_OTHER_DEVICE: 1, // Local invitee accepted on another device
  HANG_UP_BY_OTHERS: 1, // Remote party hung up after connect
  HANG_UP_BY_ME: 1, // Local user hung up after connect
  ALL_GROUP_PARTICIPANT_LEAVE: 1, // Group call ended because everyone left
  PARTICIPANT_UNKNOWN_DISCONNECTED: 5, // Remote participant disconnected unexpectedly after connect
  UNKNOWN_REASON: 10, // Unknown disconnected reason
} as const;

export type CloseReason = keyof typeof closeReasonPriority;

export type RequestCloseOverlayFn = (
  reason: CloseReason,
  options?: { delay?: boolean | number; onClose?: () => void },
) => void;

interface IRtcCallContentProps {
  inviteData: InviteData;
  isRecv: boolean;
  selfID: string;
  isOverlayOpen: boolean;
  isSingleWindow?: boolean;
  closeOverlay: () => void;
}

export const RtcCallContent: FC<IRtcCallContentProps> = ({
  inviteData,
  isRecv,
  selfID,
  isOverlayOpen,
  isSingleWindow,
  closeOverlay,
}) => {
  if (window.electronAPI?.enableCLib) {
    IMSDK.infoLogs({
      msgs: "RTC.RtcCallContent",
      keyAndValue: ["inviteData", JSON.stringify(inviteData)],
    });
  }
  const audioEl = useRef<HTMLAudioElement>(new Audio(beCalled));
  const { invitation, isJoin } = inviteData;
  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [authData, setAuthData] = useState<AuthData>({
    liveURL: "",
    token: "",
  });
  const [busyLineUsers, setBusyLineUsers] = useState<string[]>(
    inviteData.invitation?.busyLineUserIDList ?? [],
  );
  const { checkMediaAvailability, listenMediaDeviceChange } = useMediaAvailability({
    shouldWarnCamera: invitation?.mediaType === "video",
  });

  const isEnableGlobalMessageMute = useUserStore(
    (state) => state.selfInfo.globalRecvMsgOpt !== MessageReceiveOptType.Normal,
  );

  const isGroup = invitation?.sessionType !== SessionType.Single;

  const {
    runAsync: signalingGetTokenByRoomID,
    loading: signalingGetTokenByRoomIDLoading,
  } = useRequest(IMSDK.signalingGetTokenByRoomID, {
    manual: true,
  });
  const { runAsync: signalingInvite, loading: signalingInviteLoading } = useRequest(
    IMSDK.signalingInvite,
    { manual: true },
  );
  const { runAsync: signalingInviteInGroup, loading: signalingInviteInGroupLoading } =
    useRequest(IMSDK.signalingInviteInGroup, {
      manual: true,
    });

  useEffect(() => {
    if (!isOverlayOpen) {
      return;
    }
    tryInvite();
  }, [isOverlayOpen, isRecv, isGroup]);

  // listen media device change to show warning microphone or camera state.
  useEffect(() => {
    if (!isOverlayOpen) return;

    const stopListening = listenMediaDeviceChange();
    return () => {
      stopListening?.();
    };
  }, [isOverlayOpen, listenMediaDeviceChange]);

  useEffect(() => {
    if (isEnableGlobalMessageMute && isRecv) {
      return;
    }

    if (isOverlayOpen && !isJoin && !(!isRecv && isGroup)) {
      audioEl.current.loop = true;
      audioEl.current?.play();
    }
    if (isConnected) {
      audioEl.current.loop = false;
      audioEl.current.pause();
      audioEl.current.currentTime = 0;
    }
    return () => {
      audioEl.current.pause();
      audioEl.current.currentTime = 0;
    };
  }, [isOverlayOpen, isConnected, isJoin, isGroup, isRecv, isEnableGlobalMessageMute]);

  const tryInvite = async () => {
    await window.electronAPI?.checkMediaAccess("microphone");
    if (invitation?.mediaType === "video") {
      await window.electronAPI?.checkMediaAccess("camera");
    }
    if (isJoin && invitation?.roomID) {
      try {
        const { data } = await signalingGetTokenByRoomID(invitation.roomID);
        setAuthData(data);
        setTimeout(() => setConnect(true));
      } catch (error) {
        feedbackToast({ msg: t("toast.joinFailed"), error });
        requestCloseOverlay("JOIN_FAILED", { delay: true });
      }
      return;
    }
    if (!isRecv && invitation) {
      // If signal an invitation by myself, check media availability when call
      // signal-function to show warning microphone or camera state.
      // If accept others invitation, check media availability when connected.
      await checkMediaAvailability(true);
      const func = isGroup ? signalingInviteInGroup : signalingInvite;
      try {
        const { data } = await func({
          invitation,
          offlinePushInfo: {
            title: "You have a call invitation",
            desc: "You have a call invitation",
            ex: "",
            iOSPushSound: "",
            iOSBadgeCount: true,
          },
        });
        setBusyLineUsers(data.busyLineUserIDList ?? []);
        setAuthData(data);
        if (isGroup) setTimeout(() => setConnect(true));
      } catch (error: any) {
        if (error.errCode && error.errCode === 35001) {
          if (isGroup) {
            feedbackToast({ msg: t("toast.allInvitedUserBusy"), type: "warning" });
          } else {
            feedbackToast({ msg: t("toast.inviteeBusyLine"), type: "warning" });
          }
        } else {
          feedbackToast({ msg: t("toast.inviteUserFailed"), error });
        }
        requestCloseOverlay("SIGNALING_FAILED", { delay: true });
      }
    }
  };

  const connectRtc = useCallback((data?: AuthData) => {
    if (data) {
      setAuthData(data);
    }
    setTimeout(() => setConnect(true));
  }, []);

  const handleConnected = () => {
    setIsConnected(true);
    if (isRecv) {
      checkMediaAvailability(true);
    }
  };

  const closeOverlayTimer = useRef<NodeJS.Timeout | null>(null);
  const previewCloseRequestReason = useRef<CloseReason | null>(null);
  function clearCloseOverlayTimer() {
    if (closeOverlayTimer.current !== null) {
      clearTimeout(closeOverlayTimer.current);
      closeOverlayTimer.current = null;
    }
  }
  const requestCloseOverlay: RequestCloseOverlayFn = (reason, options) => {
    function handleClose() {
      previewCloseRequestReason.current = null;
      clearCloseOverlayTimer();
      options?.onClose?.();
      closeOverlay();
    }

    // Close requests race; honor higher priority.
    if (
      previewCloseRequestReason.current !== null &&
      closeReasonPriority[previewCloseRequestReason.current] <=
        closeReasonPriority[reason]
    )
      return;

    clearCloseOverlayTimer();
    if (options?.delay !== undefined) {
      previewCloseRequestReason.current = reason;
      const _delay = typeof options.delay === "number" ? options.delay : 3000;
      closeOverlayTimer.current = setTimeout(() => handleClose(), _delay);
    } else {
      handleClose();
    }
  };

  return (
    <div className={`${isGroup ? "group" : "single"}-rtc-wrapper`}>
      {isOverlayOpen && (
        <LiveKitRoom
          serverUrl={authData.liveURL}
          token={authData.token}
          video={invitation?.mediaType === "video"}
          audio={true}
          connect={connect}
          onConnected={handleConnected}
          onDisconnected={() => {
            function onClose() {
              setConnect(false);
              setTimeout(() => setIsConnected(false), 500);
              if (!invitation) return;
              emitToSpecifiedWindow("INSERT_RTC_MESSAGE", {
                status: RtcMessageStatus.UnknownDisconnect,
                duration: "",
                invitation: invitation,
              });
            }
            requestCloseOverlay("UNKNOWN_REASON", { onClose, delay: 3000 });
          }}
          onError={(params) => {
            if (window.electronAPI?.enableCLib) {
              IMSDK.errorLogs({
                msgs: "RTC.RtcCallContent",
                err: JSON.stringify([params, inviteData]),
              });
            }
            console.error("onError", params);
          }}
        >
          <RtcLayout
            connect={connect}
            isConnected={isConnected}
            inviteFetching={
              signalingGetTokenByRoomIDLoading ||
              signalingInviteLoading ||
              signalingInviteInGroupLoading
            }
            isSingleWindow={isSingleWindow}
            isRecv={isRecv}
            selfID={selfID}
            isGroup={isGroup}
            isJoin={isJoin}
            inviteData={inviteData}
            busyLineUsers={busyLineUsers}
            connectRtc={connectRtc}
            requestCloseOverlay={requestCloseOverlay}
          />
        </LiveKitRoom>
      )}
    </div>
  );
};
