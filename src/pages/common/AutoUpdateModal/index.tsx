import { RocketOutlined } from "@ant-design/icons";
import { useLatest } from "ahooks";
import { Button, Input, Modal, Progress, Space } from "antd";
import { forwardRef, ForwardRefRenderFunction, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { modal } from "@/AntdGlobalComp";
import { checkUpdatePkg } from "@/api/common";
import { APP_VERSION } from "@/config";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";

enum UpdateStep {
  Wating,
  Downloading,
  Applying,
  Failed,
}

const hasUpdate = (newVersion: string) => {
  const currentVersion = APP_VERSION.slice(1).split("+");
  const newVersionArr = newVersion.split("+");
  const currentVersionNum = Number(currentVersion[0].replace(new RegExp(/\./g), ""));
  const newVersionNum = Number(newVersionArr[0].replace(new RegExp(/\./g), ""));

  if (currentVersionNum === newVersionNum) {
    const currentBuildVersionNum = Number(currentVersion[1] ?? 0);
    const newBuildVersionNum = Number(newVersionArr[1] ?? 0);

    return newBuildVersionNum > currentBuildVersionNum;
  }
  return newVersionNum > currentVersionNum;
};

const AutoUpdateModal: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const [step, setStep] = useState<UpdateStep>(UpdateStep.Wating);
  const [progress, setProgress] = useState<number>(0);
  const [versionInfo, setVersionInfo] = useState<API.AutoUpdate.Version>(
    {} as API.AutoUpdate.Version,
  );
  const latestVersionInfo = useLatest(versionInfo);
  const { isOverlayOpen, openOverlay, closeOverlay } = useOverlayVisible(ref);

  const { t } = useTranslation();

  useEffect(() => {
    if (!window.electronAPI) return;
    const updateDownloadProgressHandler = (_: string, progress: number) => {
      setProgress(progress);
    };
    const updateDownloadSuccessHandler = async (_: string, pkgPath: string) => {
      setStep(UpdateStep.Applying);
      try {
        const success =
          (await window.electronAPI?.appUpdate({
            isHot: latestVersionInfo.current!.hot,
            pkgPath,
          })) ?? false;
        if (!success) {
          setStep(UpdateStep.Failed);
          return;
        }
        setVersionInfo((prev) => ({ ...prev }));
      } catch (error) {
        console.log(error);
        setStep(UpdateStep.Failed);
      }
    };
    const udpateDownloadFailedHandler = () => {
      setStep(UpdateStep.Failed);
    };
    const unsubscribeUpdateDownloadProgress =
      window.electronAPI?.onUpdateDownloadProgress(updateDownloadProgressHandler);
    const unsubscribeUpdateDownloadSuccess =
      window.electronAPI?.onUpdateDownloadSuccess(updateDownloadSuccessHandler);
    const unsubscribeUpdateDownloadFailed = window.electronAPI?.onUpdateDownloadFailed(
      udpateDownloadFailedHandler,
    );
    setTimeout(checkUpdate, 5000);
    return () => {
      unsubscribeUpdateDownloadProgress?.();
      unsubscribeUpdateDownloadSuccess?.();
      unsubscribeUpdateDownloadFailed?.();
    };
  }, []);

  const checkUpdate = () => {
    checkUpdatePkg().then(({ data: { version } }) => {
      if (hasUpdate(version.version)) {
        setVersionInfo({ ...version });
        openOverlay();
      }
    });
  };

  const startDownload = () => {
    if (step === UpdateStep.Applying) {
      window.electronAPI?.hotRelaunch();
      return;
    }
    setStep(UpdateStep.Downloading);
    window.electronAPI?.startDownload(`${versionInfo.url}?is-update=true`);
  };

  const cancelUpdate = () => {
    const closeModal = () => {
      setStep(UpdateStep.Wating);
      closeOverlay();
    };
    if (step === UpdateStep.Downloading) {
      modal.confirm({
        content: t("toast.isCancelUpdate"),
        onOk: () => {
          window.electronAPI?.cancelDownload(`${versionInfo.url}?is-update=true`);
          closeModal();
        },
      });
      return;
    }
    closeModal();
  };

  const getSubTitle = () => {
    if (step === UpdateStep.Wating) {
      return t("toast.updateVersion", { version: versionInfo.version });
    }
    if (step === UpdateStep.Applying) {
      return versionInfo.hot
        ? t("toast.applyUpdateSuccess")
        : t("toast.applyDownloadSuccess");
    }
    return t("toast.applyDownloadFailed");
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <RocketOutlined size={20} className="text-[#0089ff]" />
          <div className="ml-2">{t("toast.appUpdate")}</div>
        </div>
      }
      footer={null}
      open={isOverlayOpen}
      closable={false}
      maskClosable={false}
      width={332}
      centered
      onCancel={closeOverlay}
      destroyOnClose
    >
      <div>
        {step !== UpdateStep.Downloading ? (
          <div>{getSubTitle()}</div>
        ) : (
          <div className="flex flex-col pr-4">
            <div>{t("toast.downloading")}</div>
            <Progress
              percent={progress}
              strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
            />
          </div>
        )}

        <div className="my-2">{t("toast.updateContent")}</div>
        <Input.TextArea
          autoSize={{
            minRows: 4,
            maxRows: 4,
          }}
          readOnly
          value={versionInfo.text}
        />
      </div>
      {!versionInfo.hot && step === UpdateStep.Applying ? null : (
        <div className="flex flex-row-reverse pt-3">
          <Space>
            {!versionInfo?.force && (
              <Button onClick={cancelUpdate}>
                {t(step === UpdateStep.Applying ? "toast.later" : "cancel")}
              </Button>
            )}
            <Button
              disabled={step === UpdateStep.Downloading}
              type="primary"
              onClick={startDownload}
            >
              {t(step === UpdateStep.Failed ? "retry" : "confirm")}
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default forwardRef(AutoUpdateModal);
