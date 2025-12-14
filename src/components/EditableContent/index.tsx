import { EnterOutlined } from "@ant-design/icons";
import { useClickAway } from "ahooks";
import { Button, Input, InputProps, InputRef, Space } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import { FC, useRef, useState } from "react";

import edit_name from "@/assets/images/chatSetting/edit_name.png";

interface IEditableContentProps {
  editable?: boolean;
  value?: string;
  placeholder?: string;
  className?: string;
  textClassName?: string;
  onChange?: (value: string) => Promise<void>;
  size?: InputProps["size"];
}

const EditableContent: FC<IEditableContentProps> = ({
  editable,
  value,
  placeholder,
  className,
  textClassName,
  onChange,
  size,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<InputRef>(null);
  const [editState, setEditState] = useState({
    isEdit: false,
    loading: false,
    innerValue: value,
  });

  useClickAway(
    () => {
      if (editState.isEdit) {
        setEditState({
          isEdit: false,
          loading: false,
          innerValue: value,
        });
      }
    },
    [wrapRef],
    ["mousedown", "touchstart"],
  );

  const toggleEdit = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    e.stopPropagation();
    setEditState({
      isEdit: true,
      loading: false,
      innerValue: value === "-" ? "" : value,
    });
    setTimeout(() => inputRef.current?.focus());
  };

  const handleConfirm = async () => {
    setEditState((state) => ({ ...state, loading: true }));
    await onChange?.(editState.innerValue || "");
    setEditState((state) => ({
      ...state,
      isEdit: false,
      loading: false,
    }));
  };

  return (
    <div ref={wrapRef} className={clsx("ml-3 flex items-center", className)}>
      {editState.isEdit ? (
        <Space.Compact style={{ width: "100%" }}>
          <Input
            size={size}
            spellCheck={false}
            value={editState.innerValue}
            placeholder={placeholder}
            maxLength={20}
            onChange={(e) =>
              setEditState((state) => ({ ...state, innerValue: e.target.value }))
            }
            ref={inputRef}
            onPressEnter={handleConfirm}
            suffix={<EnterOutlined rev={undefined} />}
          />
          <Button type="primary" size={size} onClick={() => handleConfirm()}>
            {t("placeholder.save")}
          </Button>
        </Space.Compact>
      ) : (
        <>
          <div className={clsx("mr-1 max-w-[240px] truncate", textClassName)}>
            {value}
          </div>
          {editable && (
            <img
              className="cursor-pointer"
              width={14}
              src={edit_name}
              alt="edit name"
              onClick={toggleEdit}
            />
          )}
        </>
      )}
    </div>
  );
};

export default EditableContent;
