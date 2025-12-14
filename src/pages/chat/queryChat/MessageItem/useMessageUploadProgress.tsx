import { CbEvents } from "@openim/wasm-client-sdk";
import { WSEvent } from "@openim/wasm-client-sdk/lib/types/entity";
import { useEffect, useState } from "react";

import { IMSDK } from "@/layout/MainContentWrap";

export function useMessageUploadProgress(uploadClientMsgID: string) {
  const savedProgress =
    sessionStorage.getItem(`uploadProgress_${uploadClientMsgID}`) || 0;
  const [uploadProgress, setUploadProgress] = useState(Number(savedProgress));

  useEffect(() => {
    const uploadHandler = ({
      data: { clientMsgID, progress },
    }: WSEvent<{ clientMsgID: string; progress: number }>) => {
      if (clientMsgID === uploadClientMsgID) {
        sessionStorage.setItem(
          `uploadProgress_${uploadClientMsgID}`,
          progress.toString(),
        );
        setUploadProgress(progress);
      }
    };
    IMSDK.on(CbEvents.OnProgress, uploadHandler);
    return () => {
      IMSDK.off(CbEvents.OnProgress, uploadHandler);
    };
  }, []);

  return uploadProgress;
}
