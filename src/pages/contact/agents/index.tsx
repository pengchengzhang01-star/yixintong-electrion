import { Empty, Space, Tag } from "antd";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import agent_icon from "@/assets/images/contact/agent.png";
import OIMAvatar from "@/components/OIMAvatar";
import { useContactStore } from "@/store";
import emitter from "@/utils/events";

export const Agents = () => {
  const { t } = useTranslation();
  const agents = useContactStore((state) => state.agents);

  const showUserCard = useCallback((userID: string) => {
    emitter.emit("OPEN_USER_CARD", {
      userID,
    });
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <div className="m-5.5 text-base font-extrabold">{t("placeholder.agents")}</div>
      {!agents.length ? (
        <Empty className="mt-[30%]" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="ml-4 mt-4 flex-1 overflow-auto pr-4">
          {agents.map((agent) => (
            <div
              key={agent.userID}
              className="flex items-center rounded-md px-3.5 pb-3 pt-2.5 transition-colors hover:bg-[var(--primary-active)]"
              onClick={() => showUserCard(agent.userID)}
            >
              <OIMAvatar src={agent.faceURL} text={agent.nickname} />
              <Space size={4} direction="vertical" className="ml-3">
                <div className="truncate text-sm">{agent.nickname}</div>
                <Tag
                  className="flex w-fit items-center gap-1"
                  icon={<img src={agent_icon} width={20} alt="" />}
                  bordered={false}
                  color="processing"
                >
                  {String(agent.model)}
                </Tag>
              </Space>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
