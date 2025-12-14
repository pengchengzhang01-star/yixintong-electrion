import { t } from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";

import { feedbackToast } from "@/utils/common";

const AUDIO_INPUT_KIND = "audioinput" as const;
const VIDEO_INPUT_KIND = "videoinput" as const;

export type MediaAvailability = {
  hasMicrophone: boolean;
  hasCamera: boolean;
};

type UseMediaAvailabilityOptions = {
  shouldWarnCamera?: boolean;
};

export const useMediaAvailability = (options: UseMediaAvailabilityOptions = {}) => {
  const { shouldWarnCamera = true } = options;
  const [availability, setAvailability] = useState<MediaAvailability>({
    hasMicrophone: true,
    hasCamera: true,
  });
  // React state updates are async. Browsers (Chrome) may emit multiple
  // `devicechange` events for a single plug/unplug, and relying on state can
  // compare against stale values. Keep the latest availability in a ref to
  // prevent duplicate warnings.
  const latestAvailabilityRef = useRef(availability);

  // encapsulate navigator.mediaDevices.enumerateDevices
  const enumerateDevices = useCallback(async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) {
      return [] as MediaDeviceInfo[];
    }
    try {
      return await navigator.mediaDevices.enumerateDevices();
    } catch (error) {
      console.error("enumerateDevices failed", error);
      return [] as MediaDeviceInfo[];
    }
  }, []);

  // sync media availability state at first time
  const syncMediaAvailabilityState = useCallback(
    async (options: { shouldUpdateState?: boolean } = {}) => {
      const { shouldUpdateState = true } = options;
      const devices = await enumerateDevices();
      const hasMicrophone = devices.some((device) => device.kind === AUDIO_INPUT_KIND);
      const hasCamera = devices.some((device) => device.kind === VIDEO_INPUT_KIND);
      const nextAvailability: MediaAvailability = { hasMicrophone, hasCamera };
      const prevAvailability = latestAvailabilityRef.current;
      latestAvailabilityRef.current = nextAvailability;
      if (shouldUpdateState) {
        setAvailability(nextAvailability);
      }

      return { nextAvailability, prevAvailability };
    },
    [enumerateDevices],
  );

  // notify availability change
  const notifyAvailability = useCallback(
    (
      shouldWarnMicrophone: boolean,
      shouldWarnCameraNow: boolean,
      forceNotify: boolean,
    ) => {
      if (!shouldWarnMicrophone && !shouldWarnCameraNow && !forceNotify) {
        return;
      }

      if (shouldWarnMicrophone && shouldWarnCameraNow) {
        feedbackToast({
          msg: t("toast.microphoneAndCameraNotFound"),
          type: "warning",
        });
      } else if (shouldWarnMicrophone) {
        feedbackToast({
          msg: t("toast.microphoneNotFound"),
          type: "warning",
        });
      } else if (shouldWarnCameraNow) {
        feedbackToast({
          msg: t("toast.cameraNotFound"),
          type: "warning",
        });
      }
    },
    [],
  );

  // manually check media availability without mutating React state
  // if shouldNotify is true, notify availability state
  const checkMediaAvailability = useCallback(
    async (shouldNotify = true) => {
      // must call syncMediaAvailabilityState to get latest availability state
      // to avoid user call checkMediaAvailability before state not initialized.
      const { nextAvailability } = await syncMediaAvailabilityState({
        shouldUpdateState: false,
      });
      if (shouldNotify) {
        const shouldWarnMicrophone = !nextAvailability.hasMicrophone;
        const shouldWarnCameraNow = shouldWarnCamera && !nextAvailability.hasCamera;
        notifyAvailability(shouldWarnMicrophone, shouldWarnCameraNow, true);
      }
      return nextAvailability;
    },
    [notifyAvailability, shouldWarnCamera, syncMediaAvailabilityState],
  );

  // devicechange event handler
  const handleMediaDeviceChange = useCallback(async () => {
    const { nextAvailability, prevAvailability } = await syncMediaAvailabilityState();
    const shouldWarnMicrophone =
      !nextAvailability.hasMicrophone && prevAvailability.hasMicrophone;
    const shouldWarnCameraNow =
      shouldWarnCamera && !nextAvailability.hasCamera && prevAvailability.hasCamera;
    notifyAvailability(shouldWarnMicrophone, shouldWarnCameraNow, false);
    return nextAvailability;
  }, [notifyAvailability, shouldWarnCamera, syncMediaAvailabilityState]);

  const listenMediaDeviceChange = useCallback(() => {
    if (!navigator?.mediaDevices?.addEventListener) {
      return () => undefined;
    }

    const handleChange = async () => {
      await handleMediaDeviceChange();
    };
    navigator.mediaDevices.addEventListener("devicechange", handleChange);

    return () => {
      navigator.mediaDevices?.removeEventListener("devicechange", handleChange);
    };
  }, [handleMediaDeviceChange]);

  useEffect(() => {
    syncMediaAvailabilityState();
  }, [syncMediaAvailabilityState]);

  return {
    checkMediaAvailability,
    listenMediaDeviceChange,
    availability,
  };
};

export default useMediaAvailability;
