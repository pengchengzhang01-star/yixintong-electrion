import { MessageItem } from "@openim/wasm-client-sdk";
import { Empty, Popover, Spin } from "antd";
import { t } from "i18next";
import { useEffect, useState } from "react";
import { Virtuoso } from "react-virtuoso";

import { delCollectRecord, getCollectRecords } from "@/api/collect";
import { MessageRenderContext } from "@/constants";
import { feedbackToast } from "@/utils/common";
import { emit } from "@/utils/events";
import { formatAtText, formatMessageTime } from "@/utils/imCommon";

import CardMessageRenderer from "../chat/queryChat/MessageItem/CardMessageRenderer";
import FileMessageRenderer from "../chat/queryChat/MessageItem/FileMessageRenderer";
import MediaMessageRender from "../chat/queryChat/MessageItem/MediaMessageRender";
import VoiceMessageRender from "../chat/queryChat/MessageItem/VoiceMessageRender";

type CollectMessage = {
  collectID: string;
  collectType: API.Collect.CollectType;
  content: MessageItem;
  createTime: number;
};

export const Favorites = () => {
  const [favorites, setFavorites] = useState<CollectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCollectID, setActiveCollectID] = useState<string | null>(null);

  useEffect(() => {
    // Fetch favorites from the API
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await getCollectRecords();
        setFavorites(
          response.collects.map((item) => ({
            collectID: item.collectID,
            collectType: item.collectType,
            content: JSON.parse(item.content) as MessageItem,
            createTime: item.createTime,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      }
      setLoading(false);
    };
    fetchFavorites();
  }, []);

  const removeCollect = async (collectID: string) => {
    try {
      setLoading(true);
      await delCollectRecord([collectID]);
      setFavorites((prev) => prev.filter((collect) => collect.collectID !== collectID));
    } catch (error) {
      feedbackToast({ error });
    }
    setLoading(false);
  };

  return (
    <div className="flex w-full">
      <div className="flex w-72 flex-col bg-white p-1.5 pr-1">
        <div className="p-3 font-semibold">{t("placeholder.favorites")}</div>
        <Spin spinning={loading} wrapperClassName="flex-1">
          {favorites.length ? (
            <Virtuoso
              data={favorites}
              computeItemKey={(_, item) => item.collectID}
              itemContent={(_, collect) => (
                <CollectMessageItem
                  collect={collect}
                  className="mb-1.5 rounded-md px-3 py-2 hover:bg-[var(--primary-active)]"
                  removeCollect={removeCollect}
                  setActiveCollectID={setActiveCollectID}
                  renderContext={MessageRenderContext.CollectionPreview}
                />
              )}
            />
          ) : (
            <Empty className="flex h-full flex-col items-center justify-center" />
          )}
        </Spin>
      </div>
      <div className="flex-1 py-0.5 pr-0.5">
        <div className="flex-1 overflow-auto p-2">
          {activeCollectID &&
            favorites
              .filter((collect) => collect.collectID === activeCollectID)
              .map((collect) => (
                <CollectMessageItem
                  key={collect.collectID}
                  collect={collect}
                  className="rounded-md bg-white p-3"
                  renderContext={MessageRenderContext.CollectionDetail}
                />
              ))}
        </div>
      </div>
    </div>
  );
};

const CollectMessageItem = ({
  collect,
  className,
  removeCollect,
  setActiveCollectID,
  renderContext,
}: {
  collect: CollectMessage;
  className?: string;
  setActiveCollectID?: (id: string) => void;
  removeCollect?: (id: string) => Promise<void>;
  renderContext?: MessageRenderContext;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const isPreviewMode = renderContext === MessageRenderContext.CollectionPreview;

  const getTextContent = (message: MessageItem) => {
    if (message.textElem) {
      return message.textElem.content;
    }
    if (message.atTextElem) {
      return formatAtText(message.atTextElem, true);
    }
    if (message.quoteElem) {
      return message.quoteElem.text;
    }
    return "";
  };

  const deleteCollect = async () => {
    setLoading(true);
    await removeCollect?.(collect.collectID);
    setLoading(false);
  };

  const forwardCollect = () => {
    emit("OPEN_CHOOSE_MODAL", {
      type: "FORWARD_MESSAGE",
      extraData: collect.content,
    });
    setShowMenu(false);
  };

  function renderContent() {
    const message = collect.content;
    if (message.textElem || message.atTextElem || message.quoteElem) {
      return (
        <div className={!isPreviewMode ? "select-text" : "line-clamp-2"}>
          {getTextContent(message)}
        </div>
      );
    }
    if (message.pictureElem || message.videoElem) {
      return (
        <MediaMessageRender isSender message={message} renderContext={renderContext} />
      );
    }
    if (message.fileElem) {
      return (
        <FileMessageRenderer message={message} isSender renderContext={renderContext} />
      );
    }
    if (message.soundElem) {
      return (
        <VoiceMessageRender
          message={message}
          isSender={false}
          renderContext={renderContext}
        />
      );
    }
    if (message.cardElem) {
      return (
        <CardMessageRenderer message={message} isSender renderContext={renderContext} />
      );
    }
    return null;
  }

  const menu = (
    <Spin spinning={loading}>
      <div className="p-1">
        <div
          className="cursor-pointer rounded px-3 py-2 text-xs hover:bg-[var(--primary-active)]"
          onClick={forwardCollect}
        >
          {t("placeholder.forward")}
        </div>

        <div
          className="cursor-pointer rounded px-3 py-2 text-xs text-[#FF381F] hover:bg-[var(--primary-active)]"
          onClick={deleteCollect}
        >
          {t("placeholder.remove")}
        </div>
      </div>
    </Spin>
  );

  return (
    <Popover
      overlayClassName="common-menu-popover"
      placement="bottomLeft"
      title={null}
      arrow={false}
      open={!isPreviewMode ? false : showMenu}
      onOpenChange={(vis) => setShowMenu(vis)}
      content={menu}
      trigger="contextMenu"
    >
      <div
        className={className}
        onClick={() => setActiveCollectID?.(collect.collectID)}
      >
        {renderContent()}
        <div className="mt-2 flex justify-between text-xs text-[var(--sub-text)]">
          <span>{collect.content.senderNickname}</span>
          <span>{formatMessageTime(collect.createTime)}</span>
        </div>
      </div>
    </Popover>
  );
};
