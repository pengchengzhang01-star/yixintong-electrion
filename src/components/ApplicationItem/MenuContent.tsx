import { FriendApplicationItem, GroupApplicationItem } from "@openim/wasm-client-sdk";
import { Spin } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import { FC, memo, useState } from "react";

import { ApplicationItemSource } from "@/components/ApplicationItem";
import { useContactStore } from "@/store";
import { feedbackToast } from "@/utils/common";

const MenuItem: FC<{ title: string; className?: string; onClick: () => void }> = ({
  title,
  className,
  onClick,
}) => (
  <div
    className={clsx(
      "cursor-pointer rounded px-3 py-2 text-xs hover:bg-[var(--primary-active)]",
      className,
    )}
    onClick={onClick}
  >
    {title}
  </div>
);

const MenuContent = memo(
  ({
    application,
    closeMenu,
  }: {
    application: Partial<ApplicationItemSource>;
    closeMenu: () => void;
  }) => {
    const [loading, setLoading] = useState(false);
    const deleteFriendApplication = useContactStore(
      (state) => state.deleteFriendApplication,
    );
    const deleteGroupApplication = useContactStore(
      (state) => state.deleteGroupApplication,
    );

    const deleteApplication = async () => {
      setLoading(true);
      try {
        if (application.groupID) {
          await deleteGroupApplication(application as GroupApplicationItem);
        } else {
          await deleteFriendApplication(application as FriendApplicationItem);
        }
      } catch (error) {
        feedbackToast({ error, msg: t("toast.deleteApplicationFailed") });
      }
      setLoading(false);
      closeMenu();
    };

    return (
      <Spin spinning={loading}>
        <div className="p-1">
          <MenuItem
            className="text-[#FF381F]"
            title={t("placeholder.remove")}
            onClick={deleteApplication}
          />
        </div>
      </Spin>
    );
  },
);

export default MenuContent;
