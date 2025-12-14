import { GroupItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import speaker from "@/assets/images/chatHeader/speaker.png";
import { escapeHtml } from "@/utils/common";
import { formatLink } from "@/utils/imCommon";

import { IMessageItemProps } from ".";

interface GroupAnnouncementElem {
  group: GroupItem;
}

const AnnouncementRenderer: FC<IMessageItemProps> = ({ message }) => {
  const { t } = useTranslation();

  const notificationElem = JSON.parse(
    message.notificationElem!.detail,
  ) as GroupAnnouncementElem;

  return (
    <div className="min-w-[240px] rounded-md border border-[var(--gap-text)] px-3 py-2.5">
      <div className="mb-1 flex items-center">
        <img width={20} src={speaker} alt="spear" />
        <span className="ml-2 text-[var(--primary)]">
          {t("placeholder.groupAnnouncement")}
        </span>
      </div>
      <div
        className="text-break"
        dangerouslySetInnerHTML={{
          __html: formatLink(escapeHtml(notificationElem.group.notification)),
        }}
      ></div>
    </div>
  );
};

export default AnnouncementRenderer;
