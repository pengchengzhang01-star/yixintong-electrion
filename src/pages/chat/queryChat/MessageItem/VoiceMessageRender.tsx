import { useLatest } from "ahooks";
import clsx from "clsx";
import { FC, useEffect, useRef, useState } from "react";

import { MessageRenderContext } from "@/constants";
import { useMessageFileDownloadState } from "@/hooks/useMessageFileDownloadState";
import VoiceIcon from "@/svg/VoiceIcon";
import { feedbackToast } from "@/utils/common";
import { addUserPlayedVoiceId, getUserPlayedVoiceIds } from "@/utils/storage";

import { IMessageItemProps } from ".";
import styles from "./message-item.module.scss";

const VoiceMessageRender: FC<IMessageItemProps> = ({
  message,
  isSender,
  renderContext,
}) => {
  const audioEl = useRef<HTMLAudioElement>(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const latestIsPlaying = useLatest(isPlaying);
  const [showUnRead, setShowUnRead] = useState(false);
  const { tryDownload } = useMessageFileDownloadState(message);
  let isPaused = false;

  const avoidPreview = renderContext === MessageRenderContext.CollectionPreview;

  const getSourceUrl = () => {
    if (message.localEx && window.electronAPI?.fileExists(message.localEx)) {
      return `file://${message.localEx}`;
    }
    return message.soundElem!.sourceUrl;
  };

  useEffect(() => {
    checkVoiceReadStatus();
    audioEl.current.src = getSourceUrl();
    audioEl.current.onended = () => {
      setIsPlaying(false);
      isPaused = false;
    };
    audioEl.current.onpause = () => {
      setIsPlaying(false);
      isPaused = true;
    };
    audioEl.current.onplay = () => {
      setIsPlaying(true);
    };
    return () => {
      if (latestIsPlaying.current) {
        audioEl.current.pause();
      }
    };
  }, []);

  const checkVoiceReadStatus = async () => {
    if (isSender) {
      return;
    }
    const readIds = await getUserPlayedVoiceIds();
    setShowUnRead(readIds.has(message.clientMsgID));
  };

  const playAudio = () => {
    if (showUnRead) {
      setShowUnRead(false);
      addUserPlayedVoiceId(message.clientMsgID);
    }
    if (!message.localEx) {
      tryDownload();
    }
    if (isPlaying) {
      audioEl.current?.pause();
      setIsPlaying(false);
    } else {
      audioEl.current
        ?.play()
        .catch((error) => feedbackToast({ error, msg: "play audio failed" }));
      isPaused = false;
    }
  };

  return (
    <div
      className={clsx(
        styles.bubble,
        "relative flex cursor-pointer items-center !py-2",
        !isSender && "flex-row-reverse",
        renderContext !== MessageRenderContext.Chat && "justify-end",
      )}
      onClick={avoidPreview ? undefined : playAudio}
    >
      <VoiceIcon
        style={{ transform: isSender ? "rotateY(180deg)" : "none" }}
        readed={!showUnRead && !isSender}
        playing={isPlaying}
      />
      <span className={isSender ? "mr-1" : "ml-1"}>{`${
        message.soundElem!.duration
      } ‘’`}</span>
      {showUnRead && (
        <div className="absolute left-full h-1.5 w-1.5 translate-x-1 rounded-full bg-red-500"></div>
      )}
    </div>
  );
};

export default VoiceMessageRender;
