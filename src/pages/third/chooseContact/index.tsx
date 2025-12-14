import { CloseOutlined } from "@ant-design/icons";
import { FriendUserItem, GroupItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { Button } from "antd";
import { t } from "i18next";
import { useRef } from "react";

import ChooseBox, { ChooseBoxHandle } from "@/pages/common/ChooseModal/ChooseBox";

interface ContactData {
  notConversation: boolean;
  friendList: FriendUserItem[];
  groupList: GroupItem[];
}

export const ChooseContact = () => {
  const chooseBoxRef = useRef<ChooseBoxHandle>(null);

  const closeWindow = () => {
    window.electronAPI?.closeWindow("choose-contact");
  };

  const confirmChoose = () => {
    // todo
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-16 items-center justify-between bg-[var(--gap-text)] px-7">
        <div>{t("placeholder.selectMember")}</div>
        <CloseOutlined
          className="app-no-drag cursor-pointer text-[var(--sub-text)]"
          rev={undefined}
          onClick={closeWindow}
        />
      </div>
      <ChooseBox className="flex-1" ref={chooseBoxRef} notConversation />
      <div className="flex justify-end px-9 py-6">
        <Button
          className="mr-6 border-0 bg-[var(--chat-bubble)] px-6"
          onClick={closeWindow}
        >
          {t("cancel")}
        </Button>
        <Button className="px-6" type="primary" onClick={confirmChoose}>
          {t("confirm")}
        </Button>
      </div>
    </div>
  );
};
