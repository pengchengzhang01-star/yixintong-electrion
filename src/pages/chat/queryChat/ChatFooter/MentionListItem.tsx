import clsx from "clsx";
import { t } from "i18next";
import React from "react";

import { MentionItemRendererProps } from "@/components/ChatInput/models/types";
import OIMAvatar from "@/components/OIMAvatar";

const MentionListItem = ({
  ref,
  item,
  isHighlighted,
  onClick,
  onMouseEnter,
}: MentionItemRendererProps) => {
  return (
    <div
      key={item.id}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      ref={ref as React.Ref<HTMLDivElement>}
      className={clsx(
        "flex items-center rounded-md px-2 py-2 hover:bg-[var(--primary-active)]",
        isHighlighted && "bg-[var(--primary-active)]",
      )}
    >
      <OIMAvatar size={26} text={item.atAll ? "@" : item.nickname} src={item.faceURL} />
      <div className="!ml-2 max-w-[200px] truncate">
        {item.atAll ? t("placeholder.mentionAll") : String(item.nickname)}
      </div>
    </div>
  );
};

export default MentionListItem;
