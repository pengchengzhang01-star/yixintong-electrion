import { GroupMemberRole } from "@openim/wasm-client-sdk";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";

const AT_ALL_KEY = "AtAllTag";

export function useMention(wrapperRef: React.RefObject<HTMLDivElement>) {
  const { t } = useTranslation();

  const getMentions = useCallback(() => {
    const domEl = wrapperRef.current;
    if (!domEl) return [];

    const atels = Array.from(domEl.querySelectorAll(".im-mention-blot"));

    const atList = atels.map((at) => ({
      userID: at.attributes.getNamedItem("data-id")!.value,
      nickname: at.attributes.getNamedItem("data-value")!.value,
    }));

    const uniqueAtList = atList.reduce((acc, curr) => {
      if (!acc.find((item) => item.userID === curr.userID)) {
        acc.push(curr);
      }
      return acc;
    }, [] as typeof atList);

    return uniqueAtList;
  }, []);

  const fetchMentionUsers = useCallback(async (keyword: string) => {
    const groupID = useConversationStore.getState().currentConversation?.groupID;
    if (!groupID) return [];

    const atList = getMentions();
    if (atList.length > 9) return [];

    try {
      if ((useConversationStore.getState().currentGroupInfo?.memberCount ?? 0) > 1000) {
        let hasMore = true;
        let offset = 0;
        while (hasMore) {
          const { data } = await IMSDK.getGroupMemberList({
            groupID,
            offset,
            count: 500,
            filter: 0,
          });
          hasMore = data.length === 500;
          offset += data.length;
        }
      }
      const { data } = await IMSDK.searchGroupMembers({
        groupID,
        offset: 0,
        count: 100,
        keywordList: [keyword],
        isSearchMemberNickname: true,
        isSearchUserID: false,
      });
      if (data.length === 0) return [];

      const users = data.map((item) => ({
        ...item,
        id: item.userID,
        value: item.nickname,
      }));
      const roleLevel = useConversationStore.getState().currentMemberInGroup?.roleLevel;
      if (
        !keyword &&
        (roleLevel === GroupMemberRole.Admin || roleLevel === GroupMemberRole.Owner)
      ) {
        // eslint-disable-next-line
        users.unshift({
          id: AT_ALL_KEY,
          value: t("placeholder.mentionAll"),
          atAll: true,
        } as any);
      }
      return users;
    } catch (error) {
      return [];
    }
  }, []);

  return { fetchMentionUsers, getMentions };
}
