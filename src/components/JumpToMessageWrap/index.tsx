import { ViewType } from "@openim/wasm-client-sdk";
import { MessageItem } from "@openim/wasm-client-sdk/lib/types/entity";
import { Popover } from "antd";
import { t } from "i18next";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useImperativeHandle,
  useState,
} from "react";

import { useConversationToggle } from "@/hooks/useConversationToggle";
import { useUserStore } from "@/store";
import { emitToSpecifiedWindow } from "@/utils/events";

interface IJumpToMessageWrap {
  message: MessageItem;
  isChildWindow: boolean;
  conversationID: string;
  viewType?: ViewType;
  disabled?: boolean;
  children: React.ReactNode;
  afterJump?: () => void;
}

const JumpToMessageWrap: ForwardRefRenderFunction<
  { jumpToHistory: () => void },
  IJumpToMessageWrap
> = (
  { message, isChildWindow, viewType = ViewType.Search, children, disabled, afterJump },
  ref,
) => {
  const [showAvatorMenu, setShowAvatorMenu] = useState(false);

  const { toSpecifiedConversation } = useConversationToggle();

  const jumpToHistory = async () => {
    const sourceID =
      message.groupID ||
      (message.sendID === useUserStore.getState().selfInfo.userID
        ? message.recvID
        : message.sendID);
    await toSpecifiedConversation({
      sourceID,
      sessionType: message.sessionType,
      isJump: true,
      isChildWindow,
    });
    emitToSpecifiedWindow("REPEAT_JUMP_TO_HISTORY", {
      message,
      viewType,
    });
    setShowAvatorMenu(false);
    afterJump?.();
  };

  useImperativeHandle(ref, () => ({ jumpToHistory }), []);

  return (
    <Popover
      content={
        <div className="p-1">
          <div
            className="cursor-pointer rounded px-2 py-1 text-xs hover:bg-[var(--primary-active)]"
            onClick={jumpToHistory}
          >
            {t("jumpToMessage")}
          </div>
        </div>
      }
      title={null}
      trigger="contextMenu"
      placement="bottom"
      open={disabled ? false : showAvatorMenu}
      onOpenChange={(vis) => setShowAvatorMenu(vis)}
    >
      {children}
    </Popover>
  );
};

export default memo(forwardRef(JumpToMessageWrap));
