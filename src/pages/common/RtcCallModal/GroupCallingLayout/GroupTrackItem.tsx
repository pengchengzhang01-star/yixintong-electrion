import {
  TrackMutedIndicator,
  TrackReferenceOrPlaceholder,
  useIsMuted,
  VideoTrack,
} from "@livekit/components-react";
import { PublicUserItem } from "@openim/wasm-client-sdk/lib/types/entity";
import clsx from "clsx";
import { LocalParticipant, Track } from "livekit-client";
import { useMemo } from "react";

import OIMAvatar from "@/components/OIMAvatar";
import { useUserStore } from "@/store";

export const GroupTrackItem = ({
  track,
  isSingle,
  className,
}: {
  track: TrackReferenceOrPlaceholder;
  isSingle?: boolean;
  className?: string;
}) => {
  const selfInfo = useUserStore((state) => state.selfInfo);
  const isVideoMuted = useIsMuted({
    participant: track.participant,
    source: Track.Source.Camera,
  });

  const itemInfo: PublicUserItem = useMemo(() => {
    const metadata = track.participant.metadata;
    if (!metadata) {
      return (
        track.participant instanceof LocalParticipant ? selfInfo : {}
      ) as PublicUserItem;
    }
    const parsedData = JSON.parse(metadata);
    return (parsedData.userInfo ?? {}) as PublicUserItem;
  }, [track.participant.metadata, isSingle, selfInfo.userID]);

  return (
    <div className={clsx("relative max-h-[25%] min-h-[92px] w-full", className)}>
      {!isVideoMuted ? (
        <VideoTrack trackRef={track as any} />
      ) : (
        <OIMAvatar
          className="h-full w-full border-none"
          src={itemInfo.faceURL}
          text={itemInfo.nickname}
        />
      )}
      <div className="absolute bottom-2 left-2 flex max-w-[80%] items-center">
        <TrackMutedIndicator
          className="text-white"
          trackRef={{
            participant: track.participant,
            source: Track.Source.Microphone,
          }}
        />
        <div className="truncate rounded bg-[rgba(12,28,51,0.2)] px-1 py-1 text-xs text-white">
          {itemInfo.nickname}
        </div>
      </div>
    </div>
  );
};
