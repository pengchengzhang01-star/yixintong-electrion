import { Drawer, Tabs, TabsProps } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";

import { OverlayVisibleHandle, useOverlayVisible } from "@/hooks/useOverlayVisible";

import FileMessagePane from "./FileMessagePane";
import MediaMessagePane from "./MediaMessagePane";
import MessageSearchBar from "./MessageSearchBar";
import NomalMessagePane from "./NomalMessagePane";
import styles from "./styles.module.scss";

const SEARCH_TAB_KEY = {
  NORMAL: "NORMAL",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  FILE: "FILE",
} as const;

type SearchTabKey = (typeof SEARCH_TAB_KEY)[keyof typeof SEARCH_TAB_KEY];

const CAN_SEARCH_TAB_KEY: SearchTabKey[] = [SEARCH_TAB_KEY.NORMAL, SEARCH_TAB_KEY.FILE];

const SearchMessageDrawer: ForwardRefRenderFunction<OverlayVisibleHandle, unknown> = (
  _,
  ref,
) => {
  const { conversationID } = useParams();
  const [activeTab, setActiveTab] = useState<SearchTabKey>(SEARCH_TAB_KEY.NORMAL);
  const [keyword, setKeyword] = useState("");
  const { isOverlayOpen, closeOverlay } = useOverlayVisible(ref);

  const searchInputRef = useRef<{ clear: () => void }>(null);

  useEffect(() => {
    if (!isOverlayOpen) {
      setActiveTab(SEARCH_TAB_KEY.NORMAL);
      searchInputRef.current?.clear();
      setKeyword("");
    }
  }, [isOverlayOpen]);

  const items: TabsProps["items"] = [
    {
      key: SEARCH_TAB_KEY.NORMAL,
      label: t("placeholder.chat"),
    },
    {
      key: SEARCH_TAB_KEY.IMAGE,
      label: t("placeholder.image"),
    },
    {
      key: SEARCH_TAB_KEY.VIDEO,
      label: t("placeholder.video"),
    },
    {
      key: SEARCH_TAB_KEY.FILE,
      label: t("placeholder.file"),
    },
  ];

  const componentsMap = [
    {
      key: SEARCH_TAB_KEY.NORMAL,
      component: (
        <NomalMessagePane
          keyword={keyword}
          isActive={activeTab === SEARCH_TAB_KEY.NORMAL}
          conversationID={conversationID}
          isOverlayOpen={isOverlayOpen}
          closeOverlay={closeOverlay}
        />
      ),
    },
    {
      key: SEARCH_TAB_KEY.IMAGE,
      component: (
        <MediaMessagePane
          isActive={activeTab === SEARCH_TAB_KEY.IMAGE}
          conversationID={conversationID}
        />
      ),
    },
    {
      key: SEARCH_TAB_KEY.VIDEO,
      component: (
        <MediaMessagePane
          isVideo
          isActive={activeTab === SEARCH_TAB_KEY.VIDEO}
          conversationID={conversationID}
        />
      ),
    },
    {
      key: SEARCH_TAB_KEY.FILE,
      component: (
        <FileMessagePane
          keyword={keyword}
          isActive={activeTab === SEARCH_TAB_KEY.FILE}
          isOverlayOpen={isOverlayOpen}
          conversationID={conversationID}
        />
      ),
    },
  ];

  const onTabChange = (key: string) => {
    setActiveTab(key as SearchTabKey);
  };

  const handleTriggerSearch = (keyword: string) => {
    setKeyword(keyword);
  };

  return (
    <Drawer
      title={t("placeholder.messageHistory")}
      placement="right"
      rootClassName="chat-drawer"
      onClose={closeOverlay}
      open={isOverlayOpen}
      maskClassName="opacity-0"
      maskMotion={{ visible: false }}
      width={450}
      getContainer={"#chat-container"}
    >
      <div className="flex h-full flex-col">
        <Tabs
          activeKey={activeTab}
          className={styles["message-drawer-tab"]}
          items={items}
          onChange={onTabChange}
        />
        <MessageSearchBar
          ref={searchInputRef}
          show={CAN_SEARCH_TAB_KEY.includes(activeTab)}
          triggerSearch={handleTriggerSearch}
        />
        {componentsMap.map((item) => (
          <div
            key={item.key}
            className={clsx("flex-1", { hidden: activeTab !== item.key })}
          >
            {item.component}
          </div>
        ))}
      </div>
    </Drawer>
  );
};

export default memo(forwardRef(SearchMessageDrawer));
