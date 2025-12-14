import { useMergeModal } from "./MergeModal";
import { useVideoPlayer } from "./VideoPlayerModal";

export const useCommonModal = () => {
  const { showMergeModal } = useMergeModal();
  const { showVideoPlayer } = useVideoPlayer();

  return { showMergeModal, showVideoPlayer };
};
