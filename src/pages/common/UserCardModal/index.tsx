import { InfoCircleOutlined } from "@ant-design/icons";
import { CbEvents } from "@openim/wasm-client-sdk";
import { GroupJoinSource, SessionType } from "@openim/wasm-client-sdk";
import {
  FriendUserItem,
  GroupMemberItem,
  WSEvent,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { useLatest } from "ahooks";
import { Button, Divider, Spin } from "antd";
import dayjs from "dayjs";
import { t } from "i18next";
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
import { useQuery } from "react-query";
import { useCopyToClipboard } from "react-use";

import { BusinessUserInfo, getBusinessUserInfoWithDepartment } from "@/api/login";
import DraggableModalWrap from "@/components/DraggableModalWrap";
import EditableContent from "@/components/EditableContent";
import OIMAvatar from "@/components/OIMAvatar";
import { useConversationToggle } from "@/hooks/useConversationToggle";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { useUserRelation } from "@/hooks/useUserRelation";
import { IMSDK } from "@/layout/MainContentWrap";
import { useContactStore, useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";

import CardActionRow from "./CardActionRow";
import EditSelfInfo from "./EditSelfInfo";
import SendRequest from "./SendRequest";

interface IUserCardModalProps {
  userID?: string;
  groupID?: string;
  isSelf?: boolean;
  notAdd?: boolean;
  cardInfo?: CardInfo;
}

export type CardInfo = Partial<BusinessUserInfo & FriendUserItem>;

const getGender = (gender: number) => {
  if (!gender) return "-";
  return gender === 1 ? t("placeholder.man") : t("placeholder.female");
};

const UserCardModal: ForwardRefRenderFunction<
  OverlayVisibleHandle,
  IUserCardModalProps
> = (props, ref) => {
  const { userID, groupID, isSelf, notAdd } = props;

  const editInfoRef = useRef<OverlayVisibleHandle>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo>();
  const [isSendRequest, setIsSendRequest] = useState(false);
  const [userFields, setUserFields] = useState<FieldRow[]>([]);
  const [organizationFields, setOrganizationFields] = useState<FieldRow[][]>([]);
  const [gorupMemberFields, setGorupMemberFields] = useState<FieldRow[]>([]);

  const selfInfo = useUserStore((state) => state.selfInfo);
  const organizationName = useUserStore((state) => state.organizationInfo.name);

  const { isBlack, isFriend } = useUserRelation(userID ?? "");

  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);
  const { toSpecifiedConversation } = useConversationToggle();
  const [_, copyToClipboard] = useCopyToClipboard();

  const getCardInfo = async (): Promise<{
    cardInfo: CardInfo;
    memberInfo?: GroupMemberItem | null;
  }> => {
    if (isSelf) {
      setGorupMemberFields([]);
      return {
        cardInfo: selfInfo,
      };
    }
    let userInfo: CardInfo | null = null;
    const friendInfo = useContactStore
      .getState()
      .friendList.find((item) => item.userID === userID);
    if (friendInfo) {
      userInfo = { ...friendInfo };
    } else {
      const { data } = await IMSDK.getUsersInfo([userID!]);
      userInfo = { ...(data[0] ?? {}) };
    }

    let memberInfo;
    if (groupID) {
      const { data } = await IMSDK.getSpecifiedGroupMembersInfo({
        groupID,
        userIDList: [userID!],
      });
      memberInfo = data[0];
    }

    try {
      const users = await getBusinessUserInfoWithDepartment([userID!]);
      userInfo = { ...userInfo, ...users[0] };
    } catch (error) {
      console.error("get business user info failed", userID, error);
    }
    return {
      cardInfo: userInfo,
      memberInfo,
    };
  };

  const refreshData = (data?: {
    cardInfo: CardInfo | null;
    memberInfo?: GroupMemberItem;
  }) => {
    if (!data) {
      return;
    }
    const { cardInfo, memberInfo } = data;

    setCardInfo(cardInfo!);
    setUserInfoRow(cardInfo!);
    setOrganizationInfoRow(cardInfo!);
    setGroupMemberInfoRow(memberInfo);
  };

  const {
    data: fullCardInfo,
    isLoading,
    refetch,
  } = useQuery(["userInfo", userID], getCardInfo, {
    enabled: isOverlayOpen && Boolean(userID),
    onSuccess: refreshData,
  });

  const latestFullCardInfo = useLatest(fullCardInfo);

  useEffect(() => {
    if (!isOverlayOpen) return;
    const friendAddedHandler = ({ data }: WSEvent<FriendUserItem>) => {
      if (data.userID === userID) {
        refetch();
      }
    };
    IMSDK.on(CbEvents.OnFriendAdded, friendAddedHandler);
    refreshData(
      props.cardInfo ? { cardInfo: props.cardInfo } : latestFullCardInfo.current,
    );
    return () => {
      IMSDK.off(CbEvents.OnFriendAdded, friendAddedHandler);
    };
  }, [isOverlayOpen, props.cardInfo]);

  const refreshSelfInfo = useCallback(() => {
    const latestInfo = useUserStore.getState().selfInfo;
    setCardInfo(latestInfo);
    setUserInfoRow(latestInfo);
  }, [isSelf]);

  const updateCardRemark = (remark: string) => {
    setUserInfoRow({ ...cardInfo!, remark });
  };
  const setUserInfoRow = (info: CardInfo) => {
    let tmpFields = [] as FieldRow[];
    tmpFields.push({
      title: t("placeholder.nickName"),
      value: info.nickname || "",
    });
    const isFriend = info?.remark !== undefined;

    if (isFriend) {
      tmpFields.push({
        title: t("placeholder.remark"),
        value: info.remark || "-",
        editable: true,
      });
    }
    if (isFriend || isSelf) {
      tmpFields = [
        ...tmpFields,
        ...[
          {
            title: t("placeholder.gender"),
            value: getGender(info.gender!),
          },
          {
            title: t("placeholder.birth"),
            value: info.birth ? dayjs(info.birth).format("YYYY/M/D") : "-",
          },
          {
            title: t("placeholder.phoneNumber"),
            value: info.phoneNumber || "-",
          },
          {
            title: t("placeholder.email"),
            value: info.email || "-",
          },
        ],
      ];
    }
    setUserFields(tmpFields);
  };

  const setGroupMemberInfoRow = async (memberInfo?: GroupMemberItem) => {
    if (!memberInfo) {
      return;
    }

    let joinSourceStr = "-";
    if (memberInfo.joinSource === GroupJoinSource.Invitation) {
      const { data } = await IMSDK.getSpecifiedGroupMembersInfo({
        groupID: groupID!,
        userIDList: [memberInfo.inviterUserID],
      });
      const inviterInfo = data[0];
      joinSourceStr = `${inviterInfo?.nickname ?? ""}${t("placeholder.inviteToGroup")}`;
    } else {
      joinSourceStr =
        memberInfo.joinSource === GroupJoinSource.QrCode
          ? t("placeholder.qrCodeToGroup")
          : t("placeholder.selectIDToGroup");
    }
    setGorupMemberFields([
      {
        title: t("placeholder.groupNickName"),
        value: memberInfo.nickname,
      },
      {
        title: t("placeholder.joinGroupTime"),
        value: dayjs(memberInfo.joinTime).format("YYYY/M/D"),
      },
      {
        title: t("placeholder.joinGroupMode"),
        value: joinSourceStr,
      },
    ]);
  };

  const setOrganizationInfoRow = (cardInfo: CardInfo) => {
    const organizationData =
      cardInfo.members?.map((item) => [
        {
          title: t("placeholder.department"),
          value: item.department.name,
        },
        {
          title: t("placeholder.position"),
          value: item.position || "-",
        },
      ]) ?? [];
    setOrganizationFields(organizationData);
  };

  const backToCard = () => {
    setIsSendRequest(false);
  };

  const trySendRequest = () => {
    setIsSendRequest(true);
  };

  const resetState = () => {
    setCardInfo(undefined);
    setUserFields([]);
    setGorupMemberFields([]);
    setOrganizationFields([]);
    setIsSendRequest(false);
  };

  const showAddFriend = !isFriend && !isSelf && !notAdd;

  return (
    <DraggableModalWrap
      title={null}
      footer={null}
      open={isOverlayOpen}
      closable={false}
      width={332}
      centered
      onCancel={closeOverlay}
      destroyOnClose
      styles={{
        mask: {
          opacity: 0,
          transition: "none",
        },
      }}
      afterClose={resetState}
      ignoreClasses=".ignore-drag, .no-padding-modal, .cursor-pointer"
      className="no-padding-modal"
      maskTransitionName=""
    >
      <Spin spinning={isLoading}>
        {isSendRequest ? (
          <SendRequest cardInfo={cardInfo!} backToCard={backToCard} />
        ) : (
          <div className="flex max-h-[520px] min-h-[484px] flex-col overflow-hidden bg-[url(@/assets/images/common/card_bg.png)] bg-[length:332px_134px] bg-no-repeat px-5.5">
            <div className="h-[104px] min-h-[104px] w-full cursor-move" />
            <div className="ignore-drag flex flex-1 flex-col overflow-hidden">
              <div className="mb-1 flex items-center">
                <OIMAvatar
                  size={60}
                  src={cardInfo?.faceURL}
                  text={cardInfo?.nickname}
                />
                <div className="ml-3 flex h-[60px] flex-1 flex-col justify-around overflow-hidden">
                  <div className="flex w-fit max-w-[80%] items-baseline">
                    <div
                      className="flex-1 select-text truncate text-base font-medium text-white"
                      title={cardInfo?.nickname}
                    >
                      {cardInfo?.nickname}
                    </div>
                    {/* <div className="ml-3 text-xs text-white">{t("placeholder.online")}</div> */}
                  </div>
                  <div className="flex items-center">
                    <div
                      className="mr-3 cursor-pointer text-xs text-[var(--sub-text)]"
                      onClick={() => {
                        copyToClipboard(cardInfo?.userID ?? "");
                        feedbackToast({ msg: t("toast.copySuccess") });
                      }}
                    >
                      {cardInfo?.userID}
                    </div>
                    <CardActionRow
                      cardInfo={cardInfo}
                      isFriend={isFriend}
                      isBlackUser={isBlack}
                      isSelf={isSelf}
                      closeOverlay={closeOverlay}
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {Boolean(groupID) && Boolean(gorupMemberFields.length) && (
                  <UserCardDataGroup
                    divider
                    title={t("placeholder.groupInfo")}
                    fieldRows={gorupMemberFields}
                  />
                )}
                {organizationFields.map((fields, idx) => (
                  <UserCardDataGroup
                    key={idx}
                    hiddenTitle={idx > 0}
                    title={organizationName}
                    fieldRows={fields}
                  />
                ))}
                <UserCardDataGroup
                  title={t("placeholder.personalInfo")}
                  userID={cardInfo?.userID}
                  fieldRows={userFields}
                  updateCardRemark={updateCardRemark}
                />
              </div>
            </div>
            {isBlack && (
              <div className="mt-3 flex justify-center text-xs text-[var(--sub-text)]">
                <InfoCircleOutlined rev={undefined} />
                <span className="ml-1">{t("toast.userBlacked")}</span>
              </div>
            )}
            <div className="mx-1 mb-6 mt-3 flex items-center gap-6">
              {showAddFriend && (
                <Button type="primary" className="flex-1" onClick={trySendRequest}>
                  {t("placeholder.addFriends")}
                </Button>
              )}
              {isSelf && (
                <Button
                  type="primary"
                  className="flex-1"
                  onClick={() => editInfoRef.current?.openOverlay()}
                >
                  {t("placeholder.editInfo")}
                </Button>
              )}
              {!isSelf && !isBlack && (
                <Button
                  type="primary"
                  className="flex-1"
                  onClick={() =>
                    toSpecifiedConversation({
                      sourceID: userID!,
                      sessionType: SessionType.Single,
                    }).then(closeOverlay)
                  }
                >
                  {t("placeholder.sendMessage")}
                </Button>
              )}
            </div>
          </div>
        )}
      </Spin>

      <EditSelfInfo ref={editInfoRef} refreshSelfInfo={refreshSelfInfo} />
    </DraggableModalWrap>
  );
};

export default memo(forwardRef(UserCardModal));

interface IUserCardDataGroupProps {
  title: string;
  userID?: string;
  divider?: boolean;
  fieldRows: FieldRow[];
  hiddenTitle?: boolean;
  updateCardRemark?: (remark: string) => void;
}

type FieldRow = {
  title: string;
  value: string;
  editable?: boolean;
};

const UserCardDataGroup: FC<IUserCardDataGroupProps> = ({
  title,
  userID,
  divider,
  fieldRows,
  hiddenTitle,
  updateCardRemark,
}) => {
  const tryUpdateRemark = async (remark: string) => {
    try {
      await IMSDK.setFriendRemark({
        toUserID: userID!,
        remark,
      });
      updateCardRemark?.(remark);
    } catch (error) {
      feedbackToast({ error });
    }
  };
  return (
    <div>
      {!hiddenTitle && <div className="my-4 text-[var(--sub-text)]">{title}</div>}
      {fieldRows.map((fieldRow, idx) => (
        <div className="my-4 flex items-center text-xs" key={idx}>
          <div className="w-24 flex-shrink-0 text-[var(--sub-text)]">
            {fieldRow.title}
          </div>
          {fieldRow.editable ? (
            <EditableContent
              className="!ml-0"
              textClassName="font-medium"
              value={fieldRow.value}
              editable={true}
              onChange={tryUpdateRemark}
              size="small"
            />
          ) : (
            <div className="flex-1 select-text truncate">{fieldRow.value}</div>
          )}
        </div>
      ))}

      {divider && <Divider className="my-0 border-[var(--gap-text)]" />}
    </div>
  );
};
