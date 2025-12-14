import { CbEvents, WSEvent } from "@openim/wasm-client-sdk";
import { useRequest } from "ahooks";
import { Button, Result, Spin } from "antd";
import { t } from "i18next";
import { useEffect, useState } from "react";
import { useRouteError } from "react-router-dom";

import { IMSDK } from "@/layout/MainContentWrap";
import { feedbackToast } from "@/utils/common";

const GlobalErrorElement = () => {
  const error = useRouteError();
  const [progress, setProgress] = useState(0);

  const { loading, runAsync } = useRequest(IMSDK.uploadLogs, {
    manual: true,
  });

  useEffect(() => {
    const uploadHandler = ({
      data: { current, size },
    }: WSEvent<{ current: number; size: number }>) => {
      const progress = (current / size) * 100;
      console.log("OnUploadLogsProgress", Number(progress.toFixed(0)), current, size);
      setProgress(Number(progress.toFixed(0)));
    };
    IMSDK.on(CbEvents.OnUploadLogsProgress, uploadHandler);
    return () => {
      IMSDK.off(CbEvents.OnUploadLogsProgress, uploadHandler);
    };
  }, []);

  const tryLogReport = async () => {
    try {
      await runAsync({ line: 0, ex: "" });
      feedbackToast({
        msg: t("placeholder.uploadSuccess"),
      });
    } catch (error) {
      feedbackToast({
        msg: t("placeholder.uploadFailed"),
        error: error,
      });
    }
    setProgress(0);
    window.location.reload();
  };

  console.error("GlobalErrorElement");
  console.error(error);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Spin spinning={loading} tip={`${progress}%`}>
        <Result
          status="404"
          subTitle={t("toast.somethingError")}
          extra={
            <Button type="primary" loading={loading} onClick={tryLogReport}>
              {t("placeholder.recover")}
            </Button>
          }
        />
      </Spin>
    </div>
  );
};

export default GlobalErrorElement;
