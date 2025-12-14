import { Checkbox } from "antd";
import { useState } from "react";

import { modal } from "@/AntdGlobalComp";

export function useCheckConfirmModal() {
  const showCheckConfirmModal = ({
    title,
    confirmTip,
    description,
    showCheckbox = true,
    defaultChecked = false,
    onOk,
    onCancel,
  }: {
    title: string;
    confirmTip: string;
    description?: string;
    showCheckbox?: boolean;
    defaultChecked?: boolean;
    onOk: (checked: boolean) => void;
    onCancel?: () => void;
  }) => {
    let resolveChecked: () => boolean;
    const CheckboxContent = () => {
      const [localChecked, setLocalChecked] = useState(defaultChecked);
      resolveChecked = () => localChecked;
      return (
        <div>
          {showCheckbox ? (
            <Checkbox
              checked={localChecked}
              onChange={(e) => setLocalChecked(e.target.checked)}
            >
              {confirmTip}
            </Checkbox>
          ) : (
            <div>{confirmTip}</div>
          )}
          {description && (
            <div className="mt-2 text-xs text-[var(--sub-text)]">{description}</div>
          )}
        </div>
      );
    };
    modal.confirm({
      title,
      content: <CheckboxContent />,
      onOk: () => onOk(resolveChecked()),
      onCancel,
    });
  };

  return { showCheckConfirmModal };
}
