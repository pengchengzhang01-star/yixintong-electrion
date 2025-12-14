import { CbEvents } from "@openim/wasm-client-sdk";
import {
  GroupItem,
  GroupMemberItem,
  WSEvent,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { useLatest } from "ahooks";
import { useCallback, useEffect, useRef, useState } from "react";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";
import { feedbackToast } from "@/utils/common";

export const REACH_SEARCH_FLAG = "LAST_FLAG";

export interface FetchStateType {
  offset: number;
  searchOffset: number;
  count: number;
  loading: boolean;
  hasMore: boolean;
  groupMemberList: GroupMemberItem[];
  searchMemberList: GroupMemberItem[];
}

interface UseGroupMembersProps {
  groupID?: string;
  notRefresh?: boolean;
}

export default function useGroupMembers(props?: UseGroupMembersProps) {
  const { groupID, notRefresh } = props ?? {};
  const [fetchState, setFetchState] = useState<FetchStateType>({
    offset: 0,
    searchOffset: 0,
    count: 20,
    loading: false,
    hasMore: true,
    groupMemberList: [],
    searchMemberList: [],
  });
  const latestFetchState = useLatest(fetchState);
  const lastKeyword = useRef("");

  useEffect(() => {
    const currentConversationGroupID =
      useConversationStore.getState().currentConversation?.groupID;
    if (!groupID && !currentConversationGroupID) return;
    const groupMemberInfoChangedHandler = ({
      data: member,
    }: WSEvent<GroupMemberItem>) => {
      if (member.groupID === latestFetchState.current.groupMemberList[0]?.groupID) {
        const idx = latestFetchState.current.groupMemberList.findIndex(
          (item) => item.userID === member.userID,
        );
        const newMembers = [...latestFetchState.current.groupMemberList];
        newMembers[idx] = { ...member };
        setFetchState((state) => ({
          ...state,
          groupMemberList: newMembers,
        }));
      }
    };

    const groupMemberCountHandler = ({
      data,
    }: WSEvent<GroupItem | GroupMemberItem>) => {
      if (notRefresh) {
        return;
      }
      if (
        data.groupID ===
        (groupID || latestFetchState.current.groupMemberList[0]?.groupID)
      ) {
        setTimeout(() => {
          getMemberData(true);
        }, 200);
      }
    };

    const setIMListener = () => {
      IMSDK.on(CbEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler);
      IMSDK.on(CbEvents.OnGroupMemberAdded, groupMemberCountHandler);
      IMSDK.on(CbEvents.OnGroupMemberDeleted, groupMemberCountHandler);
      IMSDK.on(CbEvents.OnJoinedGroupAdded, groupMemberCountHandler);
    };

    const disposeIMListener = () => {
      IMSDK.off(CbEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler);
      IMSDK.off(CbEvents.OnGroupMemberAdded, groupMemberCountHandler);
      IMSDK.off(CbEvents.OnGroupMemberDeleted, groupMemberCountHandler);
      IMSDK.off(CbEvents.OnJoinedGroupAdded, groupMemberCountHandler);
    };
    setIMListener();
    return () => {
      disposeIMListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupID]);

  // 1. New syncGroupMembers: Dedicated logic for full sync
  const syncGroupMembers = useCallback(
    async (offset = 0) => {
      const sourceID =
        groupID ?? useConversationStore.getState().currentConversation?.groupID ?? "";
      if (!sourceID) return;

      // keep loading state during sync
      setFetchState((state) => ({
        ...state,
        loading: true,
      }));

      const count = 500;
      const { data } = await IMSDK.getGroupMemberList({
        groupID: sourceID,
        offset,
        count,
        filter: 0,
      });

      setFetchState((state) => {
        const updatedMemberList =
          offset === 0 ? data : [...state.groupMemberList, ...data];
        const hasMore = data.length === count;
        return {
          ...state,
          groupMemberList: updatedMemberList,
          hasMore,
          offset: offset + count,
          loading: true, // keep loading state during sync
        };
      });

      if (data.length === count) {
        await syncGroupMembers(offset + count);
      }
    },
    [groupID],
  );

  const searchMember = useCallback(
    async (keyword: string) => {
      const isReach = keyword === REACH_SEARCH_FLAG;
      if (
        latestFetchState.current.loading ||
        (!latestFetchState.current.hasMore && isReach)
      )
        return;

      setFetchState((state) => ({
        ...state,
        loading: true,
      }));

      const searchGroupID =
        groupID ?? useConversationStore.getState().currentConversation?.groupID ?? "";
      try {
        const { data: groups } = await IMSDK.getSpecifiedGroupsInfo([searchGroupID]);
        if (
          groups[0].memberCount > 1000 &&
          latestFetchState.current.groupMemberList.length < groups[0].memberCount
        ) {
          // The local database only stores up to 1000 members by default.
          // For large groups, we must manually sync all members to local storage
          // to ensure searchGroupMembers can find them.
          await syncGroupMembers(0);

          // syncGroupMembers execution sets loading to true,
          // and we need to ensure it stays true for the search process
          setFetchState((state) => ({
            ...state,
            loading: true,
          }));
        }
        const { data } = await IMSDK.searchGroupMembers({
          groupID: searchGroupID,
          offset: isReach ? latestFetchState.current.searchOffset : 0,
          count: 20,
          keywordList: [keyword === REACH_SEARCH_FLAG ? lastKeyword.current : keyword],
          isSearchMemberNickname: true,
          isSearchUserID: true,
        });

        lastKeyword.current = keyword;
        setFetchState((state) => ({
          ...state,
          searchMemberList: [...(isReach ? state.searchMemberList : []), ...data],
          hasMore: data.length === state.count,
          searchOffset: state.searchOffset + 20,
        }));
      } catch (error) {
        feedbackToast({
          msg: "getMemberFailed",
          error,
        });
      } finally {
        setFetchState((state) => ({
          ...state,
          loading: false,
        }));
      }
    },
    [groupID, syncGroupMembers],
  );

  // 2. Simplified getMemberData: Purely for UI pagination
  const getMemberData = useCallback(
    /**
     * Fetch group member list
     * @param refresh Whether to refresh the list (true=reset offset to 0 and fetch 500 items; false=append 100 items from current offset)
     */
    async (refresh = false) => {
      const sourceID =
        groupID ?? useConversationStore.getState().currentConversation?.groupID ?? "";
      if (!sourceID) return;

      if (
        (latestFetchState.current.loading || !latestFetchState.current.hasMore) &&
        !refresh
      )
        return;

      setFetchState((state) => ({
        ...state,
        loading: true,
      }));
      try {
        const count = refresh ? 500 : 100;
        const { data } = await IMSDK.getGroupMemberList({
          groupID: sourceID,
          offset: refresh ? 0 : latestFetchState.current.offset,
          count,
          filter: 0,
        });

        setFetchState((state) => {
          const updatedMemberList = [
            ...(refresh ? [] : state.groupMemberList),
            ...data,
          ];
          const hasMore = data.length === count;
          return {
            ...state,
            groupMemberList: updatedMemberList,
            hasMore,
            offset: state.offset + count,
            loading: false,
          };
        });
      } catch (error) {
        feedbackToast({
          msg: "getMemberFailed",
          error,
        });
        setFetchState((state) => ({
          ...state,
          loading: false,
        }));
      }
    },
    [groupID],
  );

  const resetState = () => {
    setFetchState({
      offset: 0,
      searchOffset: 0,
      count: 20,
      loading: false,
      hasMore: true,
      groupMemberList: [],
      searchMemberList: [],
    });
  };

  return {
    fetchState,
    getMemberData,
    searchMember,
    resetState,
  };
}
