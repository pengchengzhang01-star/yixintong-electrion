import { SearchOutlined } from "@ant-design/icons";
import { MessageType, SessionType } from "@openim/wasm-client-sdk";
import {
  ConversationItem,
  FriendUserItem,
  GroupItem,
  MessageItem,
  SearchMessageResultItem,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { useDebounceFn, useKeyPress, useLatest } from "ahooks";
import { Input, InputRef, Modal, Tabs } from "antd";
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

import { BusinessUserInfo, searchOrganizationUserInfo } from "@/api/login";
import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import { useMessageStore, useUserStore } from "@/store";
import { getConversationContent } from "@/utils/imCommon";

import ChatLogsPanel from "./ChatLogsPanel";
import ContactPanel from "./ContactPanel";
import ConversationPanel from "./ConversationPanel";
import DashboardPanel from "./DashboardPanel";
import FilePanel from "./FilePanel";
import styles from "./index.module.scss";

export interface SearchData<T> {
  data: T[];
  loading: boolean;
}

export type ChatLogsItem = SearchMessageResultItem & {
  sendTime: number;
  description: string;
};

const TabKeys = [
  "DashBoard",
  "Friends",
  "Colleagues",
  "Groups",
  "ChatLogs",
  "HistoryFiles",
  "Conversations",
] as const;

export type TabKey = (typeof TabKeys)[number];

const GlobalSearchModal: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const isOrganizationMember = useUserStore((state) =>
    Boolean(state.organizationInfo.name),
  );

  return (
    <Modal
      title={null}
      footer={null}
      centered
      open={isOverlayOpen}
      closable={false}
      width={"70%"}
      destroyOnClose
      onCancel={closeOverlay}
      styles={{
        mask: {
          opacity: 0,
          transition: "none",
        },
      }}
      className={clsx("no-padding-modal max-w-[800px]", styles["global-search-modal"])}
      maskTransitionName=""
    >
      <GlobalSearchContent
        closeOverlay={closeOverlay}
        isOrganizationMember={isOrganizationMember}
      />
    </Modal>
  );
};

export const GlobalSearchContent = ({
  isOrganizationMember,
  closeOverlay,
}: {
  isOrganizationMember: boolean;
  closeOverlay: () => void;
}) => {
  const [activeKey, setActiveKey] = useState<TabKey>("DashBoard");
  const [friends, setFriends] = useState<SearchData<FriendUserItem>>({
    data: [],
    loading: false,
  });
  const [colleagues, setColleagues] = useState<SearchData<BusinessUserInfo>>({
    data: [],
    loading: false,
  });
  const [groups, setGroups] = useState<SearchData<GroupItem>>({
    data: [],
    loading: false,
  });
  const [chatLogs, setChatLogs] = useState<SearchData<ChatLogsItem>>({
    data: [],
    loading: false,
  });
  const [historyFiles, setHistoryFiles] = useState<SearchData<MessageItem>>({
    data: [],
    loading: false,
  });
  const [conversations, setConversations] = useState<SearchData<ConversationItem>>({
    data: [],
    loading: false,
  });
  const latestHistoryFiles = useLatest(historyFiles);
  const searchBarRef = useRef<SearchBarHandle>(null);
  const chatLogRef = useRef<{ updateIdx: (idx: number) => void }>(null);

  useEffect(() => {
    if (location.hash.startsWith("#/contact")) {
      setActiveKey("Friends");
    }
    searchBarRef.current?.focus();
    return () => {
      resetState();
    };
  }, []);

  useEffect(() => {
    const downloadSuccessHandler = (url: string, filePath: string) => {
      const { clientMsgID } = useMessageStore.getState().downloadMap[url];

      const index = latestHistoryFiles.current.data.findIndex(
        (message) => message.clientMsgID === clientMsgID,
      );
      if (index > -1) {
        setHistoryFiles((state) => {
          const tmpMessage = [...state.data];
          tmpMessage[index].localEx = filePath;
          return {
            ...state,
            data: tmpMessage,
          };
        });
      }
    };

    const unsubscribeSuccess =
      window.electronAPI?.onDownloadSuccess(downloadSuccessHandler);

    return () => {
      unsubscribeSuccess?.();
    };
  }, []);

  useKeyPress("leftarrow", () => {
    const currentIndex = TabKeys.indexOf(activeKey);
    if (currentIndex > 0) {
      setActiveKey(TabKeys[currentIndex - 1]);
    }
  });

  useKeyPress("rightarrow", () => {
    const currentIndex = TabKeys.indexOf(activeKey);
    if (currentIndex < TabKeys.length - 1) {
      setActiveKey(TabKeys[currentIndex + 1]);
    }
  });

  const toggleTab = useCallback((tab: TabKey) => {
    setActiveKey(tab);
  }, []);

  const toggleChatLogActive = useCallback(
    (idx: number) => chatLogRef.current?.updateIdx(idx),
    [],
  );

  const resetState = () => {
    setFriends({
      data: [],
      loading: false,
    });
    setColleagues({
      data: [],
      loading: false,
    });
    setGroups({
      data: [],
      loading: false,
    });
    setChatLogs({
      data: [],
      loading: false,
    });
    setHistoryFiles({
      data: [],
      loading: false,
    });
    setConversations({
      data: [],
      loading: false,
    });
    setActiveKey("DashBoard");
    searchBarRef.current?.clearKeyword();
  };

  const tabs = [
    {
      key: "DashBoard",
      label: t("placeholder.overview"),
      visible: true,
      children: (
        <DashboardPanel
          isActive={activeKey === "DashBoard"}
          friends={friends}
          colleagues={colleagues}
          groups={groups}
          chatLogs={chatLogs}
          historyFiles={historyFiles}
          // conversations={conversations}
          closeOverlay={closeOverlay}
          toggleTab={toggleTab}
          toggleChatLogActive={toggleChatLogActive}
        />
      ),
    },
    {
      key: "Friends",
      label: t("placeholder.contacts"),
      visible: true,
      children: (
        <ContactPanel
          isActive={activeKey === "Friends"}
          {...friends}
          closeOverlay={closeOverlay}
        />
      ),
    },
    {
      key: "Colleagues",
      label: t("placeholder.organization"),
      visible: isOrganizationMember,
      children: (
        <ContactPanel
          isActive={activeKey === "Colleagues"}
          {...colleagues}
          closeOverlay={closeOverlay}
        />
      ),
    },
    {
      key: "Groups",
      label: t("placeholder.myGroup"),
      visible: true,
      children: (
        <ContactPanel
          isActive={activeKey === "Groups"}
          {...groups}
          closeOverlay={closeOverlay}
        />
      ),
    },
    {
      key: "ChatLogs",
      label: t("placeholder.messageHistory"),
      visible: true,
      children: (
        <ChatLogsPanel
          ref={chatLogRef}
          isActive={activeKey === "ChatLogs"}
          {...chatLogs}
          closeOverlay={closeOverlay}
        />
      ),
    },
    {
      key: "HistoryFiles",
      label: t("placeholder.document"),
      visible: true,
      children: <FilePanel isActive={activeKey === "HistoryFiles"} {...historyFiles} />,
    },
    // {
    //   key: "Conversations",
    //   label: t("placeholder.conversation"),
    //   children: (
    //     <ConversationPanel
    //       isActive={activeKey === "Conversations"}
    //       {...conversations}
    //       closeOverlay={closeOverlay}
    //     />
    //   ),
    // },
  ];

  const searchFriend = async (keyword: string) => {
    setFriends({
      data: [],
      loading: true,
    });
    let friendlist: FriendUserItem[] = [];
    try {
      const { data } = await IMSDK.searchFriends({
        keywordList: [keyword],
        isSearchNickname: true,
        isSearchRemark: true,
        isSearchUserID: true,
      });
      friendlist = data;
    } catch (error) {
      console.error(error);
    }
    setFriends({
      data: friendlist,
      loading: false,
    });
  };

  const searchColleague = async (keyword: string) => {
    setColleagues({
      data: [],
      loading: true,
    });
    let colleagueList: BusinessUserInfo[] = [];
    try {
      const {
        data: { users },
      } = await searchOrganizationUserInfo(keyword, 1, 200);
      colleagueList = users ?? [];
    } catch (error) {
      console.error(error);
    }
    setColleagues({
      data: colleagueList,
      loading: false,
    });
  };

  const searchGroup = async (keyword: string) => {
    setGroups({
      data: [],
      loading: true,
    });
    let groupList: GroupItem[] = [];
    try {
      const { data } = await IMSDK.searchGroups({
        keywordList: [keyword],
        isSearchGroupID: true,
        isSearchGroupName: true,
      });
      groupList = data;
    } catch (error) {
      console.error(error);
    }

    setGroups({
      data: groupList,
      loading: false,
    });
  };

  const searchChatLogs = async (keyword: string) => {
    setChatLogs({
      data: [],
      loading: true,
    });
    let chatLogList: ChatLogsItem[] = [];
    try {
      const { data } = await IMSDK.searchLocalMessages({
        conversationID: "",
        keywordList: [keyword],
        messageTypeList: [
          MessageType.TextMessage,
          MessageType.AtTextMessage,
          MessageType.FileMessage,
          MessageType.QuoteMessage,
          MessageType.CardMessage,
          MessageType.LocationMessage,
          MessageType.MergeMessage,
        ],
      });

      data.searchResultItems?.map((result) => {
        (result as ChatLogsItem).sendTime = result.messageList[0].sendTime;
        if (result.messageCount > 1) {
          (result as ChatLogsItem).description = t("placeholder.relevantMessage", {
            count: result.messageCount,
          });
        } else {
          (result as ChatLogsItem).description = getConversationContent(
            result.messageList[0],
          );
        }
      });
      chatLogList = (data.searchResultItems as ChatLogsItem[]) ?? [];
      console.log(chatLogList);
    } catch (error) {
      console.error(error);
    }
    setChatLogs({
      data: chatLogList,
      loading: false,
    });
  };

  const searchHistoryFiles = async (keyword: string) => {
    setHistoryFiles({
      data: [],
      loading: true,
    });
    let historyFileList: MessageItem[] = [];
    try {
      const { data } = await IMSDK.searchLocalMessages({
        conversationID: "",
        keywordList: [keyword],
        messageTypeList: [MessageType.FileMessage],
      });
      console.log(data);
      data.searchResultItems?.map((result) => {
        if (result.conversationType === SessionType.WorkingGroup) {
          result.messageList.map(
            (message) => (message.senderNickname = result.showName),
          );
        }
      });
      historyFileList =
        data.searchResultItems?.map((result) => result.messageList).flat() ?? [];
    } catch (error) {
      console.error(error);
    }
    setHistoryFiles({
      data: historyFileList,
      loading: false,
    });
  };

  const searchConversation = async (keyword: string) => {
    // setConversations({
    //   data: [],
    //   loading: true,
    // });
    // let conversationList: ConversationItem[] = [];
    // try {
    //   const { data } = await IMSDK.searchConversation(keyword);
    //   conversationList = data;
    //   console.error(data);
    // } catch (error) {
    //   console.error(error);
    // }
    // setConversations({
    //   data: conversationList,
    //   loading: false,
    // });
  };

  const triggerSearch = (keyword: string) => {
    if (!keyword) return;
    searchFriend(keyword);
    searchColleague(keyword);
    searchGroup(keyword);
    searchChatLogs(keyword);
    searchHistoryFiles(keyword);
    searchConversation(keyword);
  };

  return (
    <>
      <ForWardSearchBar ref={searchBarRef} triggerSearch={triggerSearch} />
      <Tabs
        className={styles["search-tab"]}
        defaultActiveKey="DashBoard"
        activeKey={activeKey}
        items={tabs}
        onChange={toggleTab as (key: string) => void}
      />
    </>
  );
};

export default memo(forwardRef(GlobalSearchModal));

type SearchBarHandle = { clearKeyword: () => void; focus: () => void };

const SearchBar: ForwardRefRenderFunction<
  SearchBarHandle,
  { triggerSearch: (value: string) => void }
> = ({ triggerSearch }, ref) => {
  const inputRef = useRef<InputRef>(null);
  const [keyword, setKeyword] = useState("");

  const { run: debounceSearch } = useDebounceFn(triggerSearch, { wait: 500 });

  const onChange = (value: string) => {
    setKeyword(value);
    debounceSearch(value);
  };

  useImperativeHandle(
    ref,
    () => ({
      clearKeyword: () => setKeyword(""),
      focus: () => inputRef.current?.focus(),
    }),
    [],
  );

  return (
    <>
      <div className="app-drag h-6"></div>
      <div className="px-6">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          value={keyword}
          ref={inputRef}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </>
  );
};

const ForWardSearchBar = memo(forwardRef(SearchBar));
