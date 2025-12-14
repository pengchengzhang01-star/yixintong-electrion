import { CloseOutlined } from "@ant-design/icons";
import { MergeElem } from "@openim/wasm-client-sdk/lib/types/entity";
import { App } from "antd";
import { ReactNode, useRef, useState } from "react";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

import { MessageRenderContext } from "@/constants";
import { PrivateMessageCountProvider } from "@/pages/chat/queryChat/usePrivateMessageCount";

import MessageItem from "../../chat/queryChat/MessageItem";

const DragComponent = ({ modal }: { modal: ReactNode }) => {
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const draggleRef = useRef<HTMLDivElement>(null);

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  return (
    <Draggable
      bounds={bounds}
      nodeRef={draggleRef}
      onStart={(event, uiData) => onStart(event, uiData)}
    >
      <div ref={draggleRef}>{modal}</div>
    </Draggable>
  );
};

export const useMergeModal = () => {
  const { modal } = App.useApp();

  const showMergeModal = (mergeData: MergeElem) => {
    const current = modal.info({
      title: null,
      icon: null,
      footer: null,
      width: 680,
      className: "no-padding-modal",
      maskStyle: {
        opacity: 0,
        transition: "none",
      },
      centered: true,
      maskTransitionName: "",
      modalRender: (modal) => <DragComponent modal={modal} />,
      content: (
        <PrivateMessageCountProvider>
          <div className="w-[680px]">
            <div className="flex h-16 items-center justify-between bg-[var(--gap-text)] px-7">
              <div className="font-medium">{mergeData?.title}</div>
              <CloseOutlined
                className="cursor-pointer text-[var(--sub-text)]"
                rev={undefined}
                onClick={() => current.destroy()}
              />
            </div>
            <div className="h-[65vh] overflow-auto">
              {mergeData?.multiMessage.map((message) => (
                <MessageItem
                  renderContext={MessageRenderContext.MergeMessage}
                  message={message}
                  isSender={false}
                  key={message.clientMsgID}
                />
              ))}
            </div>
          </div>
        </PrivateMessageCountProvider>
      ),
    });
  };

  return {
    showMergeModal,
  };
};
