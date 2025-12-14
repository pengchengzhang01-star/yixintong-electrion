import { CbEvents, GroupStatus } from "@openim/wasm-client-sdk";
import {
  GroupAtType,
  OnlineState,
  Platform,
  SessionType,
} from "@openim/wasm-client-sdk";
import {
  ConversationInputStatus,
  MessageItem,
  UserOnlineState,
  WSEvent,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { useRequest } from "ahooks";
import { Layout, Popover, Tag, Tooltip, Typography } from "antd";
import clsx from "clsx";
import i18n, { t } from "i18next";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import group_member from "@/assets/images/chatHeader/group_member.png";
import group_notice from "@/assets/images/chatHeader/group_notice.png";
import launch_group from "@/assets/images/chatHeader/launch_group.png";
import pined from "@/assets/images/chatHeader/pined.png";
import search_history from "@/assets/images/chatHeader/search_history.png";
import settings from "@/assets/images/chatHeader/settings.png";
import agent_icon from "@/assets/images/contact/agent.png";
import OIMAvatar from "@/components/OIMAvatar";
import { useCurrentMemberRole } from "@/hooks/useCurrentMemberRole";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore, useUserStore } from "@/store";
import { emit } from "@/utils/events";
import { formatMessageByType } from "@/utils/imCommon";

import GroupAnnouncementDrawer from "../GroupAnnouncementDrawer";
import GroupSetting from "../GroupSetting";
import SearchMessageDrawer from "../SearchMessageDrawer";
import SingleSetting from "../SingleSetting";
import styles from "./chat-header.module.scss";
import GroupAnnouncementCard from "./GroupAnnouncementCard";
import GroupCallingCard from "./GroupCallingCard";

const { Text } = Typography;

const menuList = [
  {
    title: t("placeholder.groupAnnouncement"),
    icon: group_notice,
    idx: 0,
  },
  {
    title: t("placeholder.historyList"),
    icon: search_history,
    idx: 1,
  },
  // {
  //   title: t("placeholder.file"),
  //   icon: file_manage,
  //   idx: 2,
  // },
  {
    title: t("placeholder.createGroup"),
    icon: launch_group,
    idx: 3,
  },
  {
    title: t("placeholder.invitation"),
    icon: launch_group,
    idx: 4,
  },
  {
    title: t("placeholder.setting"),
    icon: settings,
    idx: 5,
  },
];

i18n.on("languageChanged", () => {
  menuList[0].title = t("placeholder.groupAnnouncement");
  menuList[1].title = t("placeholder.historyList");
  menuList[2].title = t("placeholder.createGroup");
  menuList[3].title = t("placeholder.invitation");
  menuList[4].title = t("placeholder.setting");
});

const ChatHeader = ({
  isBlackUser,
  agent,
}: {
  isBlackUser: boolean;
  agent?: API.Agent.Agent;
}) => {
  const singleSettingRef = useRef<OverlayVisibleHandle>(null);
  const groupSettingRef = useRef<OverlayVisibleHandle>(null);
  const searchMessageRef = useRef<OverlayVisibleHandle>(null);
  const groupAnnouncementRef = useRef<OverlayVisibleHandle>(null);

  const currentConversation = useConversationStore(
    (state) => state.currentConversation,
  );
  const currentGroupInfo = useConversationStore((state) => state.currentGroupInfo);
  const currentUserIsInGroup = useConversationStore((state) =>
    Boolean(state.currentMemberInGroup?.userID),
  );
  const inGroup = useConversationStore((state) =>
    Boolean(state.currentMemberInGroup?.groupID),
  );

  // locale re render
  useUserStore((state) => state.appSettings.locale);

  useEffect(() => {
    if (singleSettingRef.current?.isOverlayOpen) {
      singleSettingRef.current?.closeOverlay();
    }
    if (groupSettingRef.current?.isOverlayOpen) {
      groupSettingRef.current?.closeOverlay();
    }
    if (searchMessageRef.current?.isOverlayOpen) {
      searchMessageRef.current?.closeOverlay();
    }
  }, [currentConversation?.conversationID]);

  const openGroupAnnouncementDrawer = useCallback(() => {
    groupAnnouncementRef.current?.openOverlay();
  }, []);

  const menuClick = (idx: number) => {
    switch (idx) {
      case 0:
        groupAnnouncementRef.current?.openOverlay();
        break;
      case 1:
        searchMessageRef.current?.openOverlay();
        break;
      // case 2:
      //   break;
      case 3:
      case 4:
        emit("OPEN_CHOOSE_MODAL", {
          type: isSingleSession ? "CRATE_GROUP" : "INVITE_TO_GROUP",
          extraData: isSingleSession
            ? [{ ...currentConversation }]
            : currentConversation?.groupID,
        });
        break;
      case 5:
        if (isGroupSession) {
          groupSettingRef.current?.openOverlay();
        } else {
          singleSettingRef.current?.openOverlay();
        }
        break;
      default:
        break;
    }
  };

  const showCard = () => {
    if (isSingleSession || isNotificationSession) {
      window.userClick(currentConversation?.userID);
      return;
    }
    if (currentGroupInfo && currentGroupInfo.status !== GroupStatus.Dismissed) {
      emit("OPEN_GROUP_CARD", currentGroupInfo);
    }
  };

  const isNotificationSession =
    currentConversation?.conversationType === SessionType.Notification;
  const isSingleSession = currentConversation?.conversationType === SessionType.Single;
  const isGroupSession = currentConversation?.conversationType === SessionType.Group;

  const hasGroupAnnouncement =
    currentConversation?.groupAtType === GroupAtType.AtGroupNotice;

  return (
    <Layout.Header className="relative !h-auto border-b border-b-[var(--gap-text)] !bg-white !px-3 py-3">
      <div>
        <div className="flex w-full items-center">
          <div className="flex flex-1 items-center overflow-hidden">
            <OIMAvatar
              src={currentConversation?.faceURL}
              text={currentConversation?.showName}
              isgroup={Boolean(currentConversation?.groupID)}
              isnotification={isNotificationSession}
              onClick={showCard}
            />
            <div
              className={clsx(
                "ml-3 flex !h-10.5 flex-1 flex-col justify-between overflow-hidden",
                isNotificationSession && "!justify-center",
              )}
            >
              <div className="truncate text-base font-semibold">
                {currentConversation?.showName}
              </div>
              {isSingleSession && !agent && (
                <OnlineOrTypingStatus userID={currentConversation?.userID} />
              )}
              {isGroupSession && currentUserIsInGroup && (
                <div className="flex items-center text-xs text-[var(--sub-text)]">
                  <img width={20} src={group_member} alt="member" />
                  <span>{currentGroupInfo?.memberCount}</span>
                </div>
              )}
              {agent && (
                <Tag
                  className="flex w-fit items-center gap-1"
                  icon={<img src={agent_icon} width={20} alt="" />}
                  bordered={false}
                  color="processing"
                >
                  {String(agent.model)}
                </Tag>
              )}
            </div>
          </div>

          {!isNotificationSession && (
            <div className="mr-5 flex h-fit">
              {menuList.map((menu) => {
                if (
                  (menu.idx === 0 || menu.idx === 4) &&
                  (isSingleSession || (!inGroup && !isSingleSession))
                ) {
                  return null;
                }
                if (menu.idx === 3 && (!isSingleSession || isBlackUser)) {
                  return null;
                }

                return (
                  <Tooltip title={menu.title} key={menu.idx}>
                    <img
                      className="ml-5 cursor-pointer"
                      width={20}
                      src={menu.icon}
                      alt=""
                      onClick={() => menuClick(menu.idx)}
                    />
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
        <PinedMessageCard />
      </div>
      {hasGroupAnnouncement && (
        <GroupAnnouncementCard
          currentGroupInfo={currentGroupInfo}
          conversationID={currentConversation?.conversationID}
          openGroupAnnouncementDrawer={openGroupAnnouncementDrawer}
        />
      )}
      {currentGroupInfo && <GroupCallingCard />}
      <SingleSetting ref={singleSettingRef} />
      <GroupSetting ref={groupSettingRef} />
      <SearchMessageDrawer ref={searchMessageRef} />
      <GroupAnnouncementDrawer ref={groupAnnouncementRef} />
    </Layout.Header>
  );
};

export default memo(ChatHeader);

const OnlineOrTypingStatus = ({ userID }: { userID: string }) => {
  const [typing, setTyping] = useState(false);
  const [onlineState, setOnlineState] = useState<UserOnlineState>();

  const { loading, cancel: cancelSubscribe } = useRequest(
    () => IMSDK.subscribeUsersStatus([userID]),
    {
      refreshDeps: [userID],
      onSuccess: ({ data }) => setOnlineState(data[0]),
    },
  );

  useEffect(() => {
    const userStatusChangeHandler = ({ data }: WSEvent<UserOnlineState>) => {
      if (data.userID === userID) {
        setOnlineState(data);
      }
    };
    IMSDK.on(CbEvents.OnUserStatusChanged, userStatusChangeHandler);
    return () => {
      IMSDK.off(CbEvents.OnUserStatusChanged, userStatusChangeHandler);
      IMSDK.unsubscribeUsersStatus([userID]);
      cancelSubscribe();
      setTyping(false);
    };
  }, [userID]);

  useEffect(() => {
    const conversationUserInputStatusChangedHandler = ({
      data,
    }: WSEvent<ConversationInputStatus>) => {
      const tmpConversation = useConversationStore.getState().currentConversation;
      if (
        data.conversationID !== tmpConversation?.conversationID ||
        data.userID !== tmpConversation.userID
      )
        return;

      setTyping(Boolean(data.platformIDs.length));
    };
    IMSDK.on(
      CbEvents.OnConversationUserInputStatusChanged,
      conversationUserInputStatusChangedHandler,
    );
  }, []);

  return (
    <div className="flex items-center">
      {typing ? (
        <p className="text-xs text-[var(--sub-text)]">
          {t("placeholder.typing")} <span className={styles["dot-1"]}>.</span>
          <span className={styles["dot-2"]}>.</span>
          <span className={styles["dot-3"]}>.</span>
        </p>
      ) : (
        !loading && (
          <>
            <i
              className={clsx(
                "mr-1.5 inline-block h-[6px] w-[6px] rounded-full bg-[#999]",
                {
                  "!bg-[#2ddd73]": onlineState?.status === OnlineState.Online,
                },
              )}
            />
            <span className="text-xs text-[var(--sub-text)]">
              {platformToDetails(onlineState)}
            </span>
          </>
        )
      )}
    </div>
  );
};

const platformMap: Record<Platform, string> = {
  1: "iOS",
  2: "Android",
  3: "Windows",
  4: "MacOSX",
  5: "Web",
  // @ts-ignore
  6: "MiniProgram",
  7: "Linux",
  8: "AndroidPad",
  9: "iPad",
  11: "HarmonyOS",
};

const platformToDetails = (state?: UserOnlineState) => {
  if (!state || state.status === OnlineState.Offline) return t("placeholder.offLine");
  let string = "";
  state.platformIDs?.map((platform) => (string += `${platformMap[platform]}/`));
  return `${string.slice(0, -1)}${t("placeholder.online")}`;
};

const PinedMessage = ({
  message,
  canRemove,
  extendCount = 1,
}: {
  message: MessageItem;
  canRemove?: boolean;
  extendCount?: number;
}) => {
  const removePinnedMessage = useConversationStore(
    (state) => state.removePinnedMessage,
  );

  const extend = extendCount > 1;

  return (
    <div
      className={clsx(
        "flex w-fit max-w-full items-center rounded-md bg-[#F4F5F7] p-2",
        extend && "hover:bg-[#D0D0D0]",
      )}
    >
      <img src={pined} className="h-5 w-5" alt="" />
      <div className="flex items-center overflow-hidden">
        <div className="ml-2 mr-4 flex-1 overflow-hidden">
          <Text
            className="text-[#999]"
            ellipsis={{
              tooltip: extend
                ? ""
                : `${message.senderNickname}：${formatMessageByType(message)}`,
            }}
          >
            {`${message.senderNickname}：${formatMessageByType(message)}`}
          </Text>
        </div>
        {extend && (
          <span className="text-[#999]">{t("itemsCount", { count: extendCount })}</span>
        )}
        {!extend && canRemove && (
          <span
            className="cursor-pointer text-[var(--primary)]"
            onClick={() => removePinnedMessage(message)}
          >
            {t("placeholder.remove")}
          </span>
        )}
      </div>
    </div>
  );
};

const PinedMessageCard = () => {
  const [hovered, setHovered] = useState(false);

  const pinnedMessages = useConversationStore((state) => state.pinnedMessages);
  const { isAdmin, isOwner } = useCurrentMemberRole();

  if (!pinnedMessages.length) {
    return null;
  }

  const canRemove = isAdmin || isOwner;

  return (
    <Popover
      placement="bottomLeft"
      arrow
      title={null}
      mouseEnterDelay={0.3}
      open={pinnedMessages.length > 1 && hovered}
      onOpenChange={(vis) => setHovered(vis)}
      content={
        <div className="max-h-[30vh] max-w-[50vw] space-y-2 overflow-y-auto p-3">
          {pinnedMessages.map((message) => (
            <PinedMessage
              canRemove={canRemove}
              message={message}
              key={message.clientMsgID}
            />
          ))}
        </div>
      }
      trigger="hover"
    >
      <div className="mt-2 w-fit max-w-full overflow-hidden leading-none">
        <PinedMessage
          canRemove={canRemove}
          message={pinnedMessages[0]}
          extendCount={pinnedMessages.length}
        />
      </div>
    </Popover>
  );
};
