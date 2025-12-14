import { SessionType } from "@openim/wasm-client-sdk";
import { ConversationItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { Empty, Spin } from "antd";
import clsx from "clsx";
import { memo, useEffect } from "react";
import { Virtuoso } from "react-virtuoso";

import OIMAvatar from "@/components/OIMAvatar";
import { useConversationToggle } from "@/hooks/useConversationToggle";

import styles from "./index.module.scss";
import { useKeyPage } from "./useKeyPage";

export const ConversationRender = memo(
  ({
    id,
    item,
    isActive,
    onClick,
  }: {
    id?: string;
    item: ConversationItem;
    isActive?: boolean;
    onClick?: (item: ConversationItem) => void;
  }) => {
    return (
      <div
        id={id}
        onClick={() => onClick?.(item)}
        className={clsx(
          "flex cursor-pointer items-center rounded px-3 py-2 hover:bg-[var(--primary-active)]",
          {
            "bg-[var(--primary-active)]": isActive,
          },
        )}
      >
        <OIMAvatar
          src={item.faceURL}
          text={item.showName}
          isgroup={Boolean(item.groupID)}
        />
        <div className="ml-3 max-w-[200px] truncate">{item.showName}</div>
      </div>
    );
  },
);

const ConversationPanel = ({
  data,
  loading,
  isActive,
  closeOverlay,
}: {
  data: ConversationItem[];
  loading: boolean;
  isActive: boolean;
  closeOverlay: () => void;
}) => {
  const { toSpecifiedConversation } = useConversationToggle();

  const conversationType = data[0]?.userID ? "friend" : "group";
  const { activeIdx, updateIdx } = useKeyPage({
    isActive,
    maxIndex: data.length,
    elPrefix: `#${conversationType}-item-`,
    callback: (idx) => {
      const item = data[idx];
      if (item) {
        jumpToConversation(item, idx);
      }
    },
  });

  useEffect(() => {
    if (loading) {
      updateIdx(-1);
    }
  }, [loading]);

  const jumpToConversation = (item: ConversationItem, index: number) => {
    updateIdx(index);
    toSpecifiedConversation({
      sourceID: item.userID || item.groupID || "",
      sessionType: item.groupID ? SessionType.WorkingGroup : SessionType.Single,
      isChildWindow: true,
    });
    closeOverlay();
  };

  return (
    <Spin wrapperClassName="h-full" spinning={loading}>
      <Virtuoso
        className={clsx("mx-3 h-full overflow-x-hidden", styles["virtuoso-wrapper"])}
        data={data}
        components={{
          EmptyPlaceholder: () =>
            loading ? null : (
              <Empty className="mt-[30%]" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ),
        }}
        computeItemKey={(index, item) =>
          item.userID || item.groupID || index.toString()
        }
        itemContent={(index, item) => (
          <ConversationRender
            item={item}
            id={`${conversationType}-item-${index}`}
            isActive={activeIdx === index}
            onClick={() => jumpToConversation(item, index)}
          />
        )}
      />
    </Spin>
  );
};

export default ConversationPanel;
