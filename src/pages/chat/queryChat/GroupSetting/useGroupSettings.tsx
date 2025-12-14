import { AllowType, GroupStatus, GroupVerificationType } from "@openim/wasm-client-sdk";
import { GroupItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { t } from "i18next";
import { useCallback, useRef } from "react";

import { modal } from "@/AntdGlobalComp";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";

export type PermissionField = "applyMemberFriend" | "lookMemberInfo";

export function useGroupSettings({ closeOverlay }: { closeOverlay: () => void }) {
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const selfUserID = useUserStore((state) => state.selfInfo.userID);

  const modalRef = useRef<{
    destroy: () => void;
  } | null>(null);

  const updateGroupInfo = useCallback(
    async (value: Partial<GroupItem>) => {
      if (!currentGroupInfo) return;
      try {
        await IMSDK.setGroupInfo({
          ...value,
          groupID: currentGroupInfo.groupID,
        });
      } catch (error) {
        feedbackToast({ error, msg: t("toast.updateGroupInfoFailed") });
      }
    },
    [currentGroupInfo?.groupID],
  );

  const updateNickNameInGroup = useCallback(
    async (value: string) => {
      if (!currentGroupInfo) return;
      try {
        await IMSDK.setGroupMemberInfo({
          groupID: currentGroupInfo.groupID,
          userID: selfUserID,
          nickname: value,
        });
      } catch (error) {
        feedbackToast({ error });
      }
    },
    [selfUserID, currentGroupInfo?.groupID],
  );

  const updateGroupVerification = useCallback(
    async (verification: GroupVerificationType) => {
      if (!currentGroupInfo) return;

      try {
        await IMSDK.setGroupInfo({
          groupID: currentGroupInfo?.groupID,
          needVerification: verification,
        });
      } catch (error) {
        feedbackToast({ error, msg: t("toast.updateGroupVerificationFailed") });
      }
    },
    [currentGroupInfo?.groupID],
  );

  const updateGroupMuteAll = useCallback(async () => {
    if (!currentGroupInfo || modalRef.current) return;
    const currentIsMute = currentGroupInfo.status === GroupStatus.Muted;
    const execFunc = async () => {
      try {
        await IMSDK.changeGroupMute({
          groupID: currentGroupInfo.groupID,
          isMute: !currentIsMute,
        });
      } catch (error) {
        feedbackToast({ error });
      }
      modalRef.current = null;
    };
    if (!currentIsMute) {
      modalRef.current = modal.confirm({
        title: t("placeholder.allMuted"),
        content: (
          <div className="flex items-baseline">
            <div>{t("toast.confirmAllMuted")}</div>
            <span className="text-xs text-[var(--sub-text)]">
              {t("placeholder.onlyManageCanSend")}
            </span>
          </div>
        ),
        onOk: execFunc,
        onCancel: () => {
          modalRef.current = null;
        },
      });
    } else {
      await execFunc();
    }
  }, [currentGroupInfo?.status, currentGroupInfo?.groupID]);

  const updateGroupMemberPermission = useCallback(
    async (rule: AllowType, field: PermissionField) => {
      if (!currentGroupInfo) return;

      try {
        await IMSDK.setGroupInfo({
          groupID: currentGroupInfo.groupID,
          [field]: rule,
        });
      } catch (error) {
        feedbackToast({ error });
      }
    },
    [],
  );

  const tryDismissGroup = () => {
    if (!currentGroupInfo || modalRef.current) return;

    modalRef.current = modal.confirm({
      title: t("placeholder.disbandGroup"),
      content: (
        <div className="flex items-baseline">
          <div>{t("toast.confirmDisbandGroup")}</div>
          <span className="text-xs text-[var(--sub-text)]">
            {t("placeholder.disbandGroupToast")}
          </span>
        </div>
      ),
      onOk: async () => {
        try {
          await IMSDK.dismissGroup(currentGroupInfo.groupID);
          closeOverlay();
        } catch (error) {
          feedbackToast({ error });
        }
        modalRef.current = null;
      },
      onCancel: () => {
        modalRef.current = null;
      },
    });
  };

  const tryQuitGroup = () => {
    if (!currentGroupInfo || modalRef.current) return;

    modalRef.current = modal.confirm({
      title: t("placeholder.exitGroup"),
      content: (
        <div className="flex items-baseline">
          <div>{t("toast.confirmExitGroup")}</div>
          <span className="text-xs text-[var(--sub-text)]">
            {t("placeholder.exitGroupToast")}
          </span>
        </div>
      ),
      onOk: async () => {
        try {
          await IMSDK.quitGroup(currentGroupInfo.groupID);
          closeOverlay();
        } catch (error) {
          feedbackToast({ error });
        }
        modalRef.current = null;
      },
      onCancel: () => {
        modalRef.current = null;
      },
    });
  };

  return {
    currentGroupInfo,
    updateGroupInfo,
    updateGroupMuteAll,
    updateNickNameInGroup,
    updateGroupVerification,
    updateGroupMemberPermission,
    tryQuitGroup,
    tryDismissGroup,
  };
}
