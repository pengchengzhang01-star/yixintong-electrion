import { MessageReceiveOptType } from "@openim/wasm-client-sdk";
import { ConversationItem } from "@openim/wasm-client-sdk/lib/types/entity";
import clsx from "clsx";
import { t } from "i18next";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { ListRange, Virtuoso, VirtuosoHandle } from "react-virtuoso";

import sync from "@/assets/images/common/sync.png";
import sync_error from "@/assets/images/common/sync_error.png";
import FlexibleSider from "@/components/FlexibleSider";
import { useConversationStore, useUserStore } from "@/store";
import emitter from "@/utils/events";

import ConversationItemComp from "./ConversationItem";
import ConversationSkeleton from "./ConversationSkeleton";
import styles from "./index.module.scss";

function getNextUnreadIndex(
  conversationList: ConversationItem[],
  currentIndex: number,
) {
  let nextIndex = currentIndex + 1;
  let count = 0;
  while (count < conversationList.length) {
    if (nextIndex >= conversationList.length) {
      nextIndex = 0;
    }
    if (conversationList[nextIndex].unreadCount > 0) {
      return nextIndex;
    }
    nextIndex++;
    count++;
  }
  return 0;
}

function generateSkeletons(count: number) {
  const skeletons = [] as ConversationItem[];
  for (let i = 0; i < count; i++) {
    skeletons.push({ conversationID: `skeleton-${i}` } as ConversationItem);
  }
  return skeletons;
}

const ConnectBar = () => {
  const userStore = useUserStore();
  const showLoading =
    userStore.syncState === "loading" || userStore.connectState === "loading";
  const showFailed =
    userStore.syncState === "failed" || userStore.connectState === "failed";

  const loadingTip =
    userStore.syncState === "loading" ? t("connect.syncing") : t("connect.connecting");

  const errorTip =
    userStore.syncState === "failed"
      ? t("connect.syncFailed")
      : t("connect.connectFailed");

  if (userStore.reinstall) {
    return null;
  }

  return (
    <>
      {showLoading && (
        <div className="flex h-6 items-center justify-center bg-[#0089FF] bg-opacity-10">
          <img
            src={sync}
            alt="sync"
            className={clsx("mr-1 h-3 w-3 ", styles.loading)}
          />
          <span className=" text-xs text-[#0089FF]">{loadingTip}</span>
        </div>
      )}
      {showFailed && (
        <div className="flex h-6 items-center justify-center bg-[#FF381F] bg-opacity-15">
          <img src={sync_error} alt="sync" className="mr-1 h-3 w-3" />
          <span className=" text-xs text-[#FF381F]">{errorTip}</span>
        </div>
      )}
    </>
  );
};

const ConversationSider = () => {
  const { conversationID } = useParams();
  const conversationList = useConversationStore((state) => state.conversationList);
  const conversationIniting = useConversationStore(
    (state) => state.conversationIniting,
  );
  const getConversationListByReq = useConversationStore(
    (state) => state.getConversationListByReq,
  );
  const virtuoso = useRef<VirtuosoHandle>(null);
  const hasmore = useRef(true);
  const loading = useRef(false);
  const currentIndex = useRef(0);

  useEffect(() => {
    let lastIndex = -1;
    const scrollToUnread = async () => {
      const conversations = useConversationStore.getState().conversationList;
      const conversationTotalUnread = conversations.reduce(
        (prev, current) =>
          prev +
          (current.recvMsgOpt === MessageReceiveOptType.Normal
            ? current.unreadCount
            : 0),
        0,
      );
      let afterFetchUnread = 0;
      let newIndex = getNextUnreadIndex(conversations, currentIndex.current);

      if (newIndex === lastIndex) {
        newIndex = getNextUnreadIndex(conversations, currentIndex.current + 1);
      }
      lastIndex = newIndex;

      const loadMoreConversationsIfNeeded = async () => {
        if (afterFetchUnread > conversationTotalUnread) {
          return;
        }
        const flag = await getConversationListByReq(true);
        hasmore.current = flag;
        afterFetchUnread = useConversationStore
          .getState()
          .conversationList.reduce(
            (prev, current) =>
              prev +
              (current.recvMsgOpt === MessageReceiveOptType.Normal
                ? current.unreadCount
                : 0),
            0,
          );

        await loadMoreConversationsIfNeeded();
      };

      if (
        (newIndex === 0 || newIndex < currentIndex.current) &&
        conversationTotalUnread < useConversationStore.getState().unReadCount
      ) {
        await loadMoreConversationsIfNeeded();
        newIndex = getNextUnreadIndex(
          useConversationStore.getState().conversationList,
          currentIndex.current,
        );
      }

      currentIndex.current = newIndex;
      virtuoso.current?.scrollToIndex({
        index: currentIndex.current,
        behavior: "smooth",
      });
    };
    emitter.on("TRY_JUMP_TO_UNREAD", scrollToUnread);
    return () => {
      emitter.off("TRY_JUMP_TO_UNREAD", scrollToUnread);
    };
  }, []);

  const endReached = useCallback(async () => {
    if (!hasmore.current || loading.current) return;
    loading.current = true;
    hasmore.current = await getConversationListByReq(true);
    loading.current = false;
  }, [getConversationListByReq]);

  const rangeChanged = useCallback((range: ListRange) => {
    const maybeJump = currentIndex.current - 1 === range.startIndex;
    currentIndex.current = maybeJump ? range.startIndex + 1 : range.startIndex;
  }, []);

  const dataSoure = useMemo(
    () => (conversationIniting ? generateSkeletons(20) : conversationList),
    [conversationIniting, conversationList],
  );

  const computeItemKey = useCallback(
    (_: number, item: ConversationItem) => item.conversationID,
    [],
  );

  const itemContent = useCallback(
    (_: number, conversation: ConversationItem) =>
      conversationIniting ? (
        <ConversationSkeleton />
      ) : (
        <ConversationItemComp
          isActive={conversationID === conversation.conversationID}
          conversation={conversation}
        />
      ),
    [conversationIniting, conversationID],
  );

  return (
    <div>
      <ConnectBar />
      <FlexibleSider
        needHidden={Boolean(conversationID)}
        wrapClassName="left-2 right-2 top-1.5 flex flex-col"
      >
        <Virtuoso
          className="flex-1"
          data={dataSoure}
          ref={virtuoso}
          endReached={endReached}
          rangeChanged={rangeChanged}
          computeItemKey={computeItemKey}
          itemContent={itemContent}
        />
      </FlexibleSider>
    </div>
  );
};

export default ConversationSider;
