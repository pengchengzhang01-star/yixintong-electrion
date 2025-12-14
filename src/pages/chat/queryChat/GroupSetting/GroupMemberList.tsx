import { ArrowLeftOutlined, CheckOutlined } from "@ant-design/icons";
import { GroupMemberRole } from "@openim/wasm-client-sdk";
import { GroupMemberItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { useRequest } from "ahooks";
import { Empty, Input, Modal, Spin, Tooltip } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Virtuoso } from "react-virtuoso";

import member_admin from "@/assets/images/chatSetting/member_admin.png";
import member_admin_active from "@/assets/images/chatSetting/member_admin_active.png";
import member_delete from "@/assets/images/chatSetting/member_delete.png";
import member_mute from "@/assets/images/chatSetting/member_mute.png";
import member_mute_active from "@/assets/images/chatSetting/member_mute_active.png";
import OIMAvatar from "@/components/OIMAvatar";
import { useCheckConfirmModal } from "@/hooks/useCheckConfirmModal";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import useGroupMembers, { REACH_SEARCH_FLAG } from "@/hooks/useGroupMembers";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import { getGroupConversationID } from "@/utils/imCommon";

import styles from "./group-setting.module.scss";

export interface GroupMemberListHandle {
  searchMember: (keyword: string) => void;
}

interface IGroupMemberListProps {
  isSearching: boolean;
}

const GroupMemberList: ForwardRefRenderFunction<
  GroupMemberListHandle,
  IGroupMemberListProps
> = ({ isSearching }, ref) => {
  const selfUserID = useUserStore((state) => state.selfInfo.userID);
  const { isAdmin, isOwner, currentMemberInGroup } = useCurrentMemberRole();
  const { fetchState, getMemberData, searchMember, resetState } = useGroupMembers();

  const muteModalRef = useRef<OverlayVisibleHandle>(null);
  const [choosedMember, setChoosedMember] = useState<GroupMemberItem>();

  useEffect(() => {
    if (currentMemberInGroup?.groupID) {
      getMemberData(true);
    }
    return () => {
      resetState();
    };
  }, [currentMemberInGroup?.groupID]);

  useImperativeHandle(ref, () => ({
    searchMember,
  }));

  const endReached = () => {
    if (!isSearching) {
      getMemberData();
    } else {
      searchMember(REACH_SEARCH_FLAG);
    }
  };

  const tryUpdateMute = useCallback((member: GroupMemberItem) => {
    setChoosedMember(member);
    muteModalRef.current?.openOverlay();
  }, []);

  const updateMuteState = useCallback(
    async (mutedSeconds: number) => {
      try {
        await IMSDK.changeGroupMemberMute({
          groupID: choosedMember!.groupID,
          userID: choosedMember!.userID,
          mutedSeconds,
        });
      } catch (error) {
        feedbackToast({ error });
      }
    },
    [choosedMember?.groupID, choosedMember?.userID],
  );

  const dataSource = isSearching
    ? fetchState.searchMemberList
    : fetchState.groupMemberList;

  return (
    <div className="h-full px-2 py-2.5">
      {isSearching && dataSource.length === 0 ? (
        <Empty
          className="flex h-full flex-col items-center justify-center"
          description={t("empty.noSearchResults")}
        />
      ) : (
        <Virtuoso
          className="h-full overflow-x-hidden"
          data={dataSource}
          endReached={endReached}
          components={{
            Header: () => (fetchState.loading ? <Spin /> : null),
          }}
          itemContent={(_, member) => (
            <MemberItem
              member={member}
              selfUserID={selfUserID}
              currentIsAdmin={isAdmin}
              currentIsOwner={isOwner}
              tryUpdateMute={tryUpdateMute}
            />
          )}
        />
      )}
      <ForwardMuteModal
        ref={muteModalRef}
        canCancelMute={(choosedMember?.muteEndTime ?? 0) > Date.now()}
        updateMuteState={updateMuteState}
      />
    </div>
  );
};

export default forwardRef(GroupMemberList);

interface IMemberItemProps {
  member: GroupMemberItem;
  selfUserID: string;
  currentIsOwner: boolean;
  currentIsAdmin: boolean;
  tryUpdateMute: (member: GroupMemberItem) => void;
}

const MemberItem = memo(
  ({
    member,
    selfUserID,
    currentIsOwner,
    currentIsAdmin,
    tryUpdateMute,
  }: IMemberItemProps) => {
    const isOwner = member.roleLevel === GroupMemberRole.Owner;
    const isAdmin = member.roleLevel === GroupMemberRole.Admin;
    const isMuted = member.muteEndTime > Date.now();

    const { runAsync, loading } = useRequest(IMSDK.setGroupMemberInfo, {
      manual: true,
    });

    const { showCheckConfirmModal } = useCheckConfirmModal();

    const getShowTools = () => {
      if (currentIsOwner) {
        return selfUserID !== member.userID;
      }
      if (currentIsAdmin) {
        return !isOwner && !isAdmin;
      }
      return false;
    };

    const tryKick = () => {
      showCheckConfirmModal({
        title: t("placeholder.kickMember"),
        confirmTip: t("placeholder.kickMemberConfirm"),
        onOk: async (checked) => {
          try {
            await IMSDK.kickGroupMember({
              groupID: member.groupID,
              userIDList: [member.userID],
              reason: "",
            });
            if (checked) {
              await IMSDK.deleteUserAllMessagesInConv({
                conversationID: getGroupConversationID(member.groupID),
                userID: member.userID,
              });
            }
          } catch (error) {
            feedbackToast({ error });
          }
        },
      });
    };

    const adminChange = () => {
      showCheckConfirmModal({
        title: t("toast.changeAdministrator"),
        confirmTip: t(
          isAdmin
            ? "toast.cancelAdministratorConfirm"
            : "toast.setAdministratorConfirm",
        ),
        showCheckbox: false,
        onOk: async () => {
          try {
            await runAsync({
              groupID: member.groupID,
              userID: member.userID,
              roleLevel: isAdmin ? GroupMemberRole.Normal : GroupMemberRole.Admin,
            });
          } catch (error) {
            feedbackToast({ error });
          }
        },
      });
    };

    return (
      <Spin spinning={loading}>
        <div className={styles["list-member-item"]}>
          <div
            className="flex items-center overflow-hidden"
            onClick={() => window.userClick(member.userID, member.groupID)}
          >
            <OIMAvatar src={member.faceURL} text={member.nickname} />
            <div className="ml-3 flex items-center">
              <div className="max-w-[120px] truncate">{member.nickname}</div>
              {isOwner && (
                <span className="ml-2 rounded border border-[#FF9831] px-1 text-xs text-[#FF9831]">
                  {t("placeholder.groupOwner")}
                </span>
              )}
              {isAdmin && (
                <span className="ml-2 rounded border border-[#0289FA] px-1 text-xs text-[#0289FA]">
                  {t("placeholder.administrator")}
                </span>
              )}
            </div>
          </div>
          <div className="h-[50px]">
            {getShowTools() && (
              <div className={styles["tools-row"]}>
                <Tooltip title={t("placeholder.mute")}>
                  <div
                    className="w-[50px] cursor-pointer"
                    onClick={() => tryUpdateMute(member)}
                  >
                    <img
                      width={50}
                      src={isMuted ? member_mute_active : member_mute}
                      alt=""
                    />
                  </div>
                </Tooltip>
                {currentIsOwner && (
                  <Tooltip
                    title={
                      isAdmin
                        ? t("placeholder.cancelAdministrator")
                        : t("placeholder.setAdministrator")
                    }
                  >
                    <div className="w-[50px] cursor-pointer" onClick={adminChange}>
                      <img
                        width={50}
                        src={isAdmin ? member_admin_active : member_admin}
                        alt=""
                      />
                    </div>
                  </Tooltip>
                )}
                <Tooltip title={t("placeholder.kick")}>
                  <div className="w-[50px] cursor-pointer" onClick={tryKick}>
                    <img width={50} src={member_delete} alt="" />
                  </div>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </Spin>
    );
  },
);

const MuteOptions = [
  {
    title: t("date.minute", { num: 10 }),
    value: 10 * 60,
  },
  {
    title: t("date.hour", { num: 1 }),
    value: 60 * 60,
  },
  {
    title: t("date.hour", { num: 12 }),
    value: 12 * 60 * 60,
  },
  {
    title: t("date.day", { num: 1 }),
    value: 24 * 60 * 60,
  },
  {
    title: t("date.custom"),
    value: -1,
  },
  {
    title: t("placeholder.cancelMute"),
    value: 0,
  },
];

const MuteModal: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  {
    canCancelMute: boolean;
    updateMuteState: (muteTime: number) => Promise<void>;
  }
> = ({ canCancelMute, updateMuteState }, ref) => {
  const [selectedOption, setSelectedOption] = useState<number>();
  const [customDuration, setCustomDuration] = useState(0);
  const { closeOverlay, isOverlayOpen } = useOverlayVisible(ref);

  const { loading, runAsync } = useRequest(updateMuteState, { manual: true });

  const saveMute = async () => {
    if (selectedOption === undefined) {
      return;
    }
    if (selectedOption === -1) {
      await runAsync(customDuration * 86400);
    } else {
      await runAsync(selectedOption);
    }
    closeOverlay();
  };

  return (
    <Modal
      title={null}
      footer={null}
      closable={false}
      open={isOverlayOpen}
      destroyOnClose
      centered
      onCancel={closeOverlay}
      width={320}
      className="no-padding-modal"
    >
      <Spin spinning={loading}>
        <div className="py-6">
          <div className="flex items-center justify-between px-5">
            <ArrowLeftOutlined
              className="cursor-pointer !text-[#8e9aaf]"
              onClick={closeOverlay}
            />
            <div>{t("placeholder.setMute")}</div>
            <span className="cursor-pointer text-[var(--primary)]" onClick={saveMute}>
              {t("placeholder.save")}
            </span>
          </div>
          <div className="mt-5">
            {MuteOptions.slice(
              0,
              canCancelMute ? undefined : MuteOptions.length - 1,
            ).map((option) => (
              <div
                key={option.value}
                className={clsx(
                  "flex cursor-pointer items-center justify-between px-6 py-4 hover:bg-[var(--primary-active)]",
                  { "bg-[var(--primary-active)]": selectedOption === option.value },
                )}
                onClick={() => setSelectedOption(option.value)}
              >
                <div>
                  <span>{option.title}</span>
                  {selectedOption === -1 && option.value === -1 && (
                    <>
                      <Input
                        type="number"
                        size="small"
                        min={0}
                        className="ml-4 mr-1 w-[160px]"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(Number(e.target.value))}
                      />
                      <span>{t("date.day", { num: "" })}</span>
                    </>
                  )}
                </div>
                {selectedOption === option.value && (
                  <CheckOutlined className="!text-[var(--primary)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

const ForwardMuteModal = forwardRef(MuteModal);
