import { ArrowsAltOutlined } from "@ant-design/icons";
import type { TrackReferenceOrPlaceholder } from "@livekit/components-core";
import {
  AudioTrack,
  LiveKitRoom,
  TrackLoop,
  TrackRefContext,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { RtcInviteResults } from "@openim/wasm-client-sdk/lib/types/entity";
import { Button, Modal, Popover, Spin } from "antd";
import { t } from "i18next";
import { ConnectionState, RoomEvent, Track } from "livekit-client";
import {
  FC,
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

import { modal } from "@/AntdGlobalComp";
import { useEndMeeting, useLeaveMeeting } from "@/api/meeting";
import meeting_close from "@/assets/images/rtc/meeting_close.png";
import meeting_hidden from "@/assets/images/rtc/meeting_hidden.png";
import meeting_max from "@/assets/images/rtc/meeting_max.png";
import meeting_max_cancel from "@/assets/images/rtc/meeting_max_cancel.png";
import { useMediaAvailability } from "@/hooks/useMediaAvailability";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { MeetingMetadata } from "@/pb/meeting.pb";
import { useUserStore } from "@/store";

import { ForwardMeetingMain, MeetingMainHandler } from "./MeetingMain";
import { VideoMemberItem } from "./MeetingMain/VideoMemberItem";
import { MeetingSlider } from "./MeetingSlider";
import { sortParticipants } from "./sorting";

type MeetingModalProps = {
  authData?: RtcInviteResults;
};
const MeetingModal: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  MeetingModalProps
> = ({ authData }, ref) => {
  const draRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const [positionOffset, setPositionOffset] = useState({ x: 0, y: 0 });
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window?.document?.documentElement ?? {};
    const targetRect = draRef.current!.getBoundingClientRect();
    setBounds({
      left: -targetRect?.left + uiData?.x,
      right: clientWidth - (targetRect?.right - uiData?.x),
      top: -targetRect?.top + uiData?.y,
      bottom: clientHeight - (targetRect?.bottom - uiData?.y),
    });
  };

  const forceCenter = useCallback(() => {
    const styleStr = draRef.current?.style.transform ?? "";
    const idx = styleStr.lastIndexOf("(");
    const str = styleStr.slice(idx + 1, styleStr.length - 1);
    const arr = str.replace(new RegExp("px", "g"), "").split(", ");
    setPositionOffset({
      x: 0 - Number(arr[0]),
      y: 0 - Number(arr[1]),
    });
  }, []);

  const ignoreClasses = `.cursor-pointer, .ignore-drag`;

  return (
    <Modal
      className={"no-padding-modal meeting-modal"}
      wrapClassName="pointer-events-none"
      closable={false}
      footer={null}
      mask={false}
      width={"auto"}
      maskClosable={false}
      keyboard={false}
      centered
      title={null}
      open={isOverlayOpen}
      onCancel={closeOverlay}
      styles={{
        mask: {
          opacity: 0,
          transition: "none",
        },
      }}
      maskTransitionName=""
      destroyOnClose
      modalRender={(modal) => (
        <Draggable
          positionOffset={positionOffset}
          allowAnyClick={true}
          disabled={false}
          bounds={bounds}
          onStart={(event, uiData) => onStart(event, uiData)}
          cancel={ignoreClasses}
          enableUserSelectHack={false}
        >
          <div ref={draRef}>{modal}</div>
        </Draggable>
      )}
    >
      <MeetingContent
        authData={authData}
        isOverlayOpen={isOverlayOpen}
        closeOverlay={closeOverlay}
        forceCenter={forceCenter}
      />
    </Modal>
  );
};

export default memo(forwardRef(MeetingModal));

export const MeetingContent = ({
  authData,
  isOverlayOpen,
  closeOverlay,
  forceCenter,
}: {
  authData?: RtcInviteResults;
  isOverlayOpen: boolean;
  closeOverlay: () => void;
  forceCenter: () => void;
}) => {
  if (window.electronAPI?.enableCLib) {
    IMSDK.infoLogs({
      msgs: "Meeting.MeetingContent",
      keyAndValue: ["authData", JSON.stringify(authData)],
    });
  }
  const [connect, setConnect] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const disconnectFlag = useRef(false);
  const { checkMediaAvailability, listenMediaDeviceChange } = useMediaAvailability();

  const updateDisconnectFlag = useCallback((flag: boolean) => {
    disconnectFlag.current = flag;
  }, []);

  const onDisconnected = () => {
    if (window.electronAPI?.enableCLib) {
      IMSDK.infoLogs({
        msgs: "Meeting.onDisconnected",
        keyAndValue: [],
      });
    }
    setIsConnected(false);
    setConnect(false);
    if (disconnectFlag.current) {
      closeOverlay();
      return;
    }
    modal.warning({
      title: t("placeholder.hint"),
      content: t("toast.meetingIsOver"),
      okText: t("placeholder.leaveMeeting"),
      onOk: closeOverlay,
    });
  };

  useEffect(() => {
    if (!isOverlayOpen) {
      return () => {
        updateDisconnectFlag(false);
      };
    }

    setConnect(true);
    window.electronAPI?.checkMediaAccess("camera");
    window.electronAPI?.checkMediaAccess("microphone");
    checkMediaAvailability(true);
    const stopListening = listenMediaDeviceChange();

    return () => {
      stopListening?.();
      updateDisconnectFlag(false);
    };
  }, [
    isOverlayOpen,
    listenMediaDeviceChange,
    checkMediaAvailability,
    updateDisconnectFlag,
  ]);

  return (
    <LiveKitRoom
      serverUrl={authData?.liveURL}
      token={authData?.token}
      video={false}
      audio={false}
      connect={connect}
      options={{
        publishDefaults: {
          videoCodec: "vp9",
          backupCodec: { codec: "vp8" },
        },
      }}
      onConnected={() => setIsConnected(true)}
      onDisconnected={onDisconnected}
      onError={(params) => {
        if (window.electronAPI?.enableCLib) {
          IMSDK.errorLogs({
            msgs: "RTC.RtcCallContent",
            err: JSON.stringify([params, authData]),
          });
        }
        console.error("onError", params);
      }}
    >
      <MeetingLayout
        isConnected={isConnected}
        forceCenter={forceCenter}
        closeOverlay={closeOverlay}
        updateDisconnectFlag={updateDisconnectFlag}
      />
    </LiveKitRoom>
  );
};

interface IMeetingLayout {
  isConnected: boolean;
  forceCenter: () => void;
  closeOverlay: () => void;
  updateDisconnectFlag: (flag: boolean) => void;
}
const MeetingLayout: FC<IMeetingLayout> = ({
  isConnected,
  forceCenter,
  closeOverlay,
  updateDisconnectFlag,
}) => {
  const [showSlider, setShowSlider] = useState(false);
  const [showMini, setShowMini] = useState(false);
  const [showMax, setShowMax] = useState(false);

  const [meetingDetails, setMeetingDetails] = useState<MeetingMetadata>({
    beWatchedUserIDList: null,
  } as unknown as MeetingMetadata);

  const meetingMainRef = useRef<MeetingMainHandler>(null);
  const isFirstTimeGetMetadata = useRef(true);

  const { mutateAsync: leaveMeeting, isLoading: leaveLoading } = useLeaveMeeting();
  const { mutateAsync: endMeeting, isLoading: endLoading } = useEndMeeting();

  const selfID = useUserStore((state) => state.selfInfo.userID);
  const room = useRoomContext();

  useEffect(() => {
    if (!isConnected || !room) return;
    const onRoomMetaDataChange = (metadata?: string) => {
      if (window.electronAPI?.enableCLib) {
        IMSDK.infoLogs({
          msgs: "RoomEvent.RoomMetadataChanged",
          keyAndValue: ["metadata", JSON.stringify(metadata)],
        });
      }
      if (!metadata) return;
      const details = JSON.parse(metadata) as MeetingMetadata;
      console.log("meetingDetails", details);
      if (isFirstTimeGetMetadata.current) {
        if (!details.detail?.setting?.disableMicrophoneOnJoin) {
          room.localParticipant.setMicrophoneEnabled(true);
        }
      }
      isFirstTimeGetMetadata.current = false;
      setMeetingDetails(details);
    };
    room.on(RoomEvent.RoomMetadataChanged, onRoomMetaDataChange);
    onRoomMetaDataChange(room.metadata);
    return () => {
      room.off(RoomEvent.RoomMetadataChanged, onRoomMetaDataChange);
    };
  }, [isConnected, room]);

  const updateShowSlider = useCallback(() => {
    setShowSlider((show) => !show);
  }, []);

  const updateShowMax = useCallback(() => {
    if (window.electronAPI?.enableCLib) {
      window.electronAPI?.maxmizeWindow("meeting");
    }
    setShowMax((show) => !show);
  }, []);

  const updateShowMini = useCallback(() => {
    if (window.electronAPI?.enableCLib) {
      window.electronAPI?.minimizeWindow("meeting");
      return;
    }
    setShowMini((show) => {
      if (show) {
        forceCenter();
      }
      return !show;
    });
  }, []);

  const disconnect = useCallback(
    async (closeRoom?: boolean) => {
      if (window.electronAPI?.enableCLib) {
        IMSDK.infoLogs({
          msgs: "disconnect",
          keyAndValue: ["closeRoom", JSON.stringify(closeRoom)],
        });
      }
      if (room.state === ConnectionState.Disconnected) {
        closeOverlay();
        return;
      }
      updateDisconnectFlag(true);
      const options = {
        meetingID: meetingDetails.detail?.info?.systemGenerated?.meetingID,
        userID: useUserStore.getState().selfInfo.userID,
        endType: 1,
      };

      if (closeRoom) {
        await endMeeting(options);
      } else {
        await leaveMeeting(options);
      }
      room.disconnect();
    },
    [meetingDetails.detail?.info?.systemGenerated?.meetingID, room],
  );

  const isHost =
    selfID === meetingDetails.detail?.info?.creatorDefinedMeeting?.hostUserID;

  return (
    <Spin spinning={leaveLoading || endLoading} tip="leaving...">
      <div className="flex">
        {!showMini ? (
          <>
            {/* {isConnecting ? <Spin tip={t("placeholder.connecting")} size="default" /> : null} */}
            <ForwardMeetingMain
              ref={meetingMainRef}
              roomID={meetingDetails.detail?.info?.systemGenerated?.meetingID as string}
              showSlider={showSlider}
              showMax={showMax}
              isConnected={isConnected}
              meetingDetails={meetingDetails}
              windowActions={
                <MeetingTopBar
                  isHost={isHost}
                  showMax={showMax}
                  updateShowMini={updateShowMini}
                  updateShowMax={updateShowMax}
                  disconnect={disconnect}
                />
              }
              updateShowSlider={updateShowSlider}
              disconnect={disconnect}
            />

            {showSlider && (
              <MeetingSlider
                isHost={isHost}
                isConnected={isConnected}
                roomID={
                  meetingDetails.detail?.info?.systemGenerated?.meetingID as string
                }
                meetingDetails={meetingDetails}
                updateShowSlider={updateShowSlider}
              />
            )}
          </>
        ) : (
          <MiniMeetingWin
            hostUserID={
              meetingDetails.detail?.info?.creatorDefinedMeeting?.hostUserID as string
            }
            updateShowMini={updateShowMini}
          />
        )}
      </div>
    </Spin>
  );
};

const MiniMeetingWin = memo(
  ({
    hostUserID,
    updateShowMini,
  }: {
    hostUserID: string;
    updateShowMini: () => void;
  }) => {
    const audioTracks = useTracks([Track.Source.Microphone]);
    const tracks = useTracks([
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ]).reduce((acc: TrackReferenceOrPlaceholder[], cur) => {
      const idx = acc.findIndex(
        (track) => track.participant.identity === cur.participant.identity,
      );
      if (idx > -1 && cur.source === Track.Source.ScreenShare) {
        acc[idx] = cur;
      }
      if (idx < 0) {
        acc.push(cur);
      }
      return acc;
    }, []);
    const participants = useParticipants();
    const sortedParticipants = sortParticipants(participants);
    const activeTrack = tracks.find(
      (track) => track.participant.identity === sortedParticipants[0].identity,
    );

    return (
      <div className="flex h-[136px] w-[220px] flex-col bg-[#2e3030]">
        {activeTrack && (
          <VideoMemberItem
            className="!m-0"
            hostUserID={hostUserID}
            track={activeTrack}
          />
        )}
        <ArrowsAltOutlined
          className="absolute bottom-1 right-1 cursor-pointer text-lg text-[#999]"
          onClick={updateShowMini}
        />
        <TrackLoop tracks={audioTracks}>
          <TrackRefContext.Consumer>
            {(track) => track && <AudioTrack trackRef={track as any} />}
          </TrackRefContext.Consumer>
        </TrackLoop>
      </div>
    );
  },
);

interface IMeetingTopBarProps {
  isHost: boolean;
  showMax: boolean;
  updateShowMini: () => void;
  updateShowMax: () => void;
  disconnect: (closeRoom?: boolean) => Promise<void>;
}
const MeetingTopBar: FC<IMeetingTopBarProps> = ({
  isHost,
  showMax,
  updateShowMax,
  updateShowMini,
  disconnect,
}) => {
  const audioTracks = useTracks([Track.Source.Microphone]);
  return (
    <div className="app-no-drag flex h-7 items-center">
      <div
        className="app-no-drag flex h-5 w-5 cursor-pointer items-center justify-center"
        onClick={updateShowMini}
      >
        <img src={meeting_hidden} alt="" className="h-px w-[11px] cursor-pointer" />
      </div>
      <div
        className="app-no-drag mx-1 flex h-5 w-5 cursor-pointer items-center justify-center"
        onClick={updateShowMax}
      >
        <img
          src={showMax ? meeting_max_cancel : meeting_max}
          alt=""
          className="app-no-drag h-3 w-[11px]"
        />
      </div>

      <Popover
        open={isHost ? undefined : false}
        content={<CloseMeetingContent disconnect={disconnect} />}
        trigger="click"
        placement="bottomRight"
      >
        <div
          className="app-no-drag flex h-5 w-5 cursor-pointer items-center justify-center"
          onClick={() => {
            if (!isHost) {
              disconnect();
            }
          }}
        >
          <img src={meeting_close} alt="" className="app-no-drag h-2.5 w-2.5" />
        </div>
      </Popover>
      <TrackLoop tracks={audioTracks}>
        <TrackRefContext.Consumer>
          {(track) => track && <AudioTrack trackRef={track as any} />}
        </TrackRefContext.Consumer>
      </TrackLoop>
    </div>
  );
};

type CloseMeetingContentProps = {
  disconnect: (closeRoom?: boolean) => Promise<void>;
};
export const CloseMeetingContent = memo(({ disconnect }: CloseMeetingContentProps) => {
  return (
    <div className="flex flex-col p-2.5">
      <Button
        className="mb-1.5 px-10 py-1"
        danger
        type="primary"
        onClick={() => disconnect(true)}
      >
        {t("placeholder.finishMeeting")}
      </Button>
      <Button className="px-10 py-1" danger onClick={() => disconnect()}>
        {t("placeholder.leaveMeeting")}
      </Button>
    </div>
  );
});
