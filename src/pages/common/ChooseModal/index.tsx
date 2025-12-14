import { CloseOutlined } from "@ant-design/icons";
import { GroupType, SessionType } from "@openim/wasm-client-sdk";
import { CardElem } from "@openim/wasm-client-sdk/lib/types/entity";
import {
  CustomMsgParams,
  MergerMsgParams,
} from "@openim/wasm-client-sdk/lib/types/params";
import { Button, Input, Modal, Upload } from "antd";
import clsx from "clsx";
import i18n, { t } from "i18next";
import {
  FC,
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import { v4 as uuidV4 } from "uuid";

import { message } from "@/AntdGlobalComp";
import OIMAvatar from "@/components/OIMAvatar";
import { useCheckConfirmModal } from "@/hooks/useCheckConfirmModal";
import { useConversationToggle } from "@/hooks/useConversationToggle";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { FileWithPath } from "@/pages/chat/queryChat/ChatFooter/SendActionBar/useFileMessage";
import { useSendMessage } from "@/pages/chat/queryChat/ChatFooter/useSendMessage";
import { ExMessageItem, useConversationStore, useUserStore } from "@/store";
import { feedbackToast } from "@/utils/common";
import { emit, emitToSpecifiedWindow } from "@/utils/events";
import {
  formatMessageByType,
  getGroupConversationID,
  uploadFile,
} from "@/utils/imCommon";

import ChooseBox, { ChooseBoxHandle } from "./ChooseBox";
import { CheckListItem } from "./ChooseBox/CheckItem";

export type ChooseModalType =
  | "CRATE_GROUP"
  | "INVITE_TO_GROUP"
  | "KICK_FORM_GROUP"
  | "TRANSFER_IN_GROUP"
  | "FORWARD_MESSAGE"
  | "SELECT_CARD"
  | "SHARE_CARD"
  | "SELECT_USER"
  | "RTC_INVITE"
  | "MEETING_INVITE";

export interface SelectUserExtraData {
  notConversation: boolean;
  list: CheckListItem[];
}

export interface ChooseModalState {
  type: ChooseModalType;
  extraData?: unknown;
}

interface IChooseModalProps {
  state: ChooseModalState;
}

const titleMap = {
  CRATE_GROUP: t("placeholder.createGroup"),
  INVITE_TO_GROUP: t("placeholder.invitation"),
  KICK_FORM_GROUP: t("placeholder.kickMember"),
  TRANSFER_IN_GROUP: t("placeholder.transferGroup"),
  FORWARD_MESSAGE: t("placeholder.mergeForward"),
  SELECT_CARD: t("placeholder.share"),
  SHARE_CARD: t("placeholder.share"),
  SELECT_USER: t("placeholder.selectUser"),
  RTC_INVITE: t("placeholder.selectUser"),
  MEETING_INVITE: t("placeholder.selectUser"),
};

i18n.on("languageChanged", () => {
  titleMap.CRATE_GROUP = t("placeholder.createGroup");
  titleMap.INVITE_TO_GROUP = t("placeholder.invitation");
  titleMap.KICK_FORM_GROUP = t("placeholder.kickMember");
  titleMap.TRANSFER_IN_GROUP = t("placeholder.transferGroup");
  titleMap.FORWARD_MESSAGE = t("placeholder.mergeForward");
  titleMap.SELECT_CARD = t("placeholder.share");
  titleMap.SHARE_CARD = t("placeholder.share");
  titleMap.SELECT_USER = t("placeholder.selectUser");
  titleMap.RTC_INVITE = t("placeholder.share");
  titleMap.MEETING_INVITE = t("placeholder.selectUser");
});

const showConversationTypes = ["FORWARD_MESSAGE", "SHARE_CARD", "MEETING_INVITE"];
const onlyOneTypes = ["TRANSFER_IN_GROUP", "SELECT_CARD"];
const onlyMemberTypes = ["KICK_FORM_GROUP", "TRANSFER_IN_GROUP", "RTC_INVITE"];
const canAddAgentsTypes = ["CRATE_GROUP", "INVITE_TO_GROUP"];

const ChooseModal: ForwardRefRenderFunction<OverlayVisibleHandle, IChooseModalProps> = (
  { state: { type, extraData } },
  ref,
) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  return (
    <Modal
      title={null}
      footer={null}
      centered
      open={isOverlayOpen}
      closable={false}
      width={680}
      onCancel={closeOverlay}
      destroyOnClose
      styles={{
        mask: {
          opacity: 0,
          transition: "none",
        },
      }}
      className="no-padding-modal max-w-[80vw]"
      maskTransitionName=""
    >
      <ChooseContact
        isOverlayOpen={isOverlayOpen}
        type={type}
        extraData={extraData}
        closeOverlay={closeOverlay}
      />
    </Modal>
  );
};

export default memo(forwardRef(ChooseModal));

type ChooseContactProps = {
  isOverlayOpen: boolean;
  type: ChooseModalType;
  extraData?: unknown;
  closeOverlay: () => void;
};

export const ChooseContact: FC<ChooseContactProps> = ({
  isOverlayOpen,
  type,
  extraData,
  closeOverlay,
}) => {
  const chooseBoxRef = useRef<ChooseBoxHandle>(null);
  const [loading, setLoading] = useState(false);
  const [groupBaseInfo, setGroupBaseInfo] = useState({
    groupName: "",
    groupAvatar: "",
  });

  const { sendMessage } = useSendMessage();
  const { toSpecifiedConversation } = useConversationToggle();
  const { showCheckConfirmModal } = useCheckConfirmModal();

  useEffect(() => {
    if (isOverlayOpen && type === "CRATE_GROUP" && extraData) {
      setTimeout(
        () => chooseBoxRef.current?.updatePrevCheckList(extraData as CheckListItem[]),
        100,
      );
    }
    if (isOverlayOpen && type === "SELECT_USER" && extraData) {
      setTimeout(
        () =>
          chooseBoxRef.current?.updatePrevCheckList(
            (extraData as SelectUserExtraData).list,
          ),
        100,
      );
    }
    if (!isOverlayOpen) resetState();
  }, [isOverlayOpen]);

  const confirmChoose = async () => {
    const choosedList = chooseBoxRef.current?.getCheckedList() ?? [];
    if (!choosedList?.length && type !== "SELECT_USER")
      return message.warning(t("toast.selectLeastOne"));

    if (!groupBaseInfo.groupName.trim() && type === "CRATE_GROUP")
      return message.warning(t("toast.inputGroupName"));

    setLoading(true);
    try {
      switch (type) {
        case "CRATE_GROUP":
          // if (choosedList.length === 1) {
          //   toSpecifiedConversation({
          //     sourceID: choosedList[0].userID!,
          //     sessionType: SessionType.Single,
          //   });
          //   break;
          // }
          await IMSDK.createGroup({
            groupInfo: {
              groupType: GroupType.WorkingGroup,
              groupName: groupBaseInfo.groupName,
              faceURL: groupBaseInfo.groupAvatar,
            },
            memberUserIDs: choosedList.map(
              (item) => item.userID ?? item.user?.userID ?? "",
            ),
            adminUserIDs: [],
          });
          break;
        case "INVITE_TO_GROUP":
          await IMSDK.inviteUserToGroup({
            groupID: extraData as string,
            userIDList: choosedList.map(
              (item) => item.userID ?? item.user?.userID ?? "",
            ),
            reason: "",
          });
          break;
        case "KICK_FORM_GROUP":
          showCheckConfirmModal({
            title: t("placeholder.kickMember"),
            confirmTip: t("placeholder.kickMemberConfirm"),
            onOk: async (checked) => {
              await IMSDK.kickGroupMember({
                groupID: extraData as string,
                userIDList: choosedList.map(
                  (item) => item.userID ?? item.user?.userID ?? "",
                ),
                reason: "",
              });
              if (checked) {
                await Promise.all(
                  choosedList.map((member) =>
                    IMSDK.deleteUserAllMessagesInConv({
                      conversationID: getGroupConversationID(extraData as string),
                      userID: member.userID ?? member.user?.userID ?? "",
                    }),
                  ),
                );
              }
            },
          });
          break;
        case "TRANSFER_IN_GROUP":
          await IMSDK.transferGroupOwner({
            groupID: extraData as string,
            newOwnerUserID: choosedList[0].userID!,
          });
          break;
        case "SELECT_CARD":
          sendMessage({
            message: (
              await IMSDK.createCardMessage({
                userID: choosedList[0].userID ?? choosedList[0].user?.userID ?? "",
                nickname:
                  choosedList[0].nickname ?? choosedList[0].user?.nickname ?? "",
                faceURL: choosedList[0].faceURL ?? choosedList[0].user?.faceURL ?? "",
                ex: choosedList[0].ex ?? "",
              })
            ).data,
          });
          break;
        case "FORWARD_MESSAGE":
        case "SHARE_CARD":
        case "MEETING_INVITE":
          choosedList.map(async (item) => {
            const message = await getBatchMessage();
            if (item.groupID && !(await IMSDK.isJoinGroup<boolean>(item.groupID))) {
              return;
            }
            const additional = chooseBoxRef.current?.getAdditional();
            const params = {
              message,
              recvID: item.userID ?? item.user?.userID ?? "",
              groupID: item.groupID ?? "",
            };
            if (window.electronAPI?.enableCLib) {
              emitToSpecifiedWindow("INSERT_MEETING_MESSAGE", params);
            } else {
              sendMessage(params);
            }
            if (additional) {
              const additionalMessage = (await IMSDK.createTextMessage(additional))
                .data;
              const params = {
                message: additionalMessage,
                recvID: item.userID ?? item.user?.userID ?? "",
                groupID: item.groupID ?? "",
              };
              if (window.electronAPI?.enableCLib) {
                emitToSpecifiedWindow("INSERT_MEETING_MESSAGE", params);
              } else {
                sendMessage(params);
              }
            }
          });
          message.success(t("toast.sendSuccess"));
          break;
        case "SELECT_USER":
          emit("SELECT_USER", {
            notConversation: (extraData as SelectUserExtraData).notConversation,
            choosedList,
          });
          break;
        case "RTC_INVITE":
          emit("OPEN_RTC_MODAL", {
            invitation: {
              inviterUserID: useUserStore.getState().selfInfo.userID,
              inviteeUserIDList: choosedList.map((item) => item.userID!),
              groupID:
                useConversationStore.getState().currentConversation?.groupID ?? "",
              roomID:
                useConversationStore.getState().currentConversation?.groupID ??
                uuidV4(),
              timeout: 60,
              mediaType: extraData as string,
              sessionType: SessionType.WorkingGroup,
              platformID: window.electronAPI?.getPlatform() ?? 5,
            },
          });
          break;
        default:
          break;
      }
    } catch (error) {
      feedbackToast({ error });
    }
    setLoading(false);
    closeOverlay();
  };

  const getBatchMessage = async () => {
    if ((extraData as MergerMsgParams).title) {
      return (await IMSDK.createMergerMessage(extraData as MergerMsgParams)).data;
    }
    if ((extraData as ExMessageItem).clientMsgID) {
      return (await IMSDK.createForwardMessage(extraData as ExMessageItem)).data;
    }
    if ((extraData as CustomMsgParams).data) {
      return (await IMSDK.createCustomMessage(extraData as CustomMsgParams)).data;
    }
    return (await IMSDK.createCardMessage(extraData as CardElem)).data;
  };

  const getForwardContent = () => {
    if (!showConversationTypes.includes(type)) return undefined;
    if ((extraData as MergerMsgParams).title) {
      return t("messageDescription.forwardMessage", {
        additional: (extraData as MergerMsgParams).title,
      });
    }
    if ((extraData as ExMessageItem).clientMsgID) {
      return t("messageDescription.forwardMessage", {
        additional: formatMessageByType(extraData as ExMessageItem),
      });
    }
    if ((extraData as CustomMsgParams).data) {
      return t("messageDescription.meetingMessage");
    }
    return t("messageDescription.addtionalCardMessage", {
      additional: (extraData as CardElem).nickname,
    });
  };

  const resetState = () => {
    chooseBoxRef.current?.resetState();
    setGroupBaseInfo({
      groupName: "",
      groupAvatar: "",
    });
  };

  const customUpload = async ({ file }: { file: FileWithPath }) => {
    try {
      const {
        data: { url },
      } = await uploadFile(file);
      setGroupBaseInfo((prev) => ({ ...prev, groupAvatar: url }));
    } catch (error) {
      feedbackToast({ error: t("toast.updateAvatarFailed") });
    }
  };

  const isCheckInGroup = type === "INVITE_TO_GROUP";
  const notConversation = !showConversationTypes.includes(type);

  return (
    <>
      <div className="flex h-16 items-center justify-between bg-[var(--gap-text)] px-7">
        <div>{titleMap[type]}</div>
        <CloseOutlined
          className="cursor-pointer text-[var(--sub-text)]"
          rev={undefined}
          onClick={closeOverlay}
        />
      </div>
      {type === "CRATE_GROUP" ? (
        <div className="px-6 pt-4">
          <div className="mb-6 flex items-center">
            <div className="mr-4 w-16 font-medium">{t("placeholder.groupName")}</div>
            <Input
              className="flex-1"
              placeholder={t("placeholder.pleaseEnter")}
              maxLength={16}
              spellCheck={false}
              value={groupBaseInfo.groupName}
              onChange={(e) =>
                setGroupBaseInfo((state) => ({ ...state, groupName: e.target.value }))
              }
            />
          </div>
          <div className="mb-6 flex items-center">
            <div className="mr-4 w-16 font-medium">{t("placeholder.groupAvatar")}</div>
            <div className="flex items-center">
              <OIMAvatar src={groupBaseInfo.groupAvatar} isgroup />
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={customUpload as any}
              >
                <span className="ml-3 cursor-pointer text-xs text-[var(--primary)]">
                  {t("placeholder.clickToModify")}
                </span>
              </Upload>
            </div>
          </div>
          <div className="flex">
            <div className="mr-4 w-16 font-medium">{t("placeholder.groupMember")}</div>
            <ChooseBox
              className={clsx("!m-0 !h-[40vh] flex-1", {
                "!h-[56vh]": window.electronAPI?.enableCLib,
              })}
              ref={chooseBoxRef}
              notConversation={notConversation}
              canAddAgents
              filterBlack={true}
            />
          </div>
        </div>
      ) : (
        <ChooseBox
          className="!h-[60vh]"
          ref={chooseBoxRef}
          isCheckInGroup={isCheckInGroup}
          notConversation={
            (extraData as SelectUserExtraData)?.notConversation || notConversation
          }
          canAddAgents={canAddAgentsTypes.includes(type)}
          notOrgMember={type === "SELECT_USER"}
          showGroupMember={onlyMemberTypes.includes(type)}
          chooseOneOnly={onlyOneTypes.includes(type)}
          checkMemberRole={type === "KICK_FORM_GROUP"}
          fowardContent={getForwardContent()}
          filterBlack={type === "INVITE_TO_GROUP"}
        />
      )}
      <div className="flex justify-end px-9 py-6">
        <Button
          className="mr-6 border-0 bg-[var(--chat-bubble)] px-6"
          onClick={closeOverlay}
        >
          {t("cancel")}
        </Button>
        <Button
          className="px-6"
          type="primary"
          loading={loading}
          onClick={confirmChoose}
        >
          {t("confirm")}
        </Button>
      </div>
    </>
  );
};
