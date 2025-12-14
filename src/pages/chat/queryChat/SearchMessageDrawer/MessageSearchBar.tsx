import { SearchOutlined } from "@ant-design/icons";
import { useDebounceFn } from "ahooks";
import { Input } from "antd";
import clsx from "clsx";
import { t } from "i18next";
import {
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  useImperativeHandle,
  useState,
} from "react";

const MessageSearchBar: ForwardRefRenderFunction<
  { clear: () => void },
  { show: boolean; triggerSearch: (keyword: string) => void }
> = ({ show, triggerSearch }, ref) => {
  const [keyword, setKeyword] = useState("");
  const { run: debounceSearch } = useDebounceFn(() => triggerSearch(keyword), {
    wait: 500,
  });

  useImperativeHandle(ref, () => ({ clear: () => setKeyword("") }), []);

  return (
    <div className={clsx("px-5.5", { hidden: !show })}>
      <Input
        value={keyword}
        allowClear
        spellCheck={false}
        onChange={(e) => {
          setKeyword(e.target.value);
          debounceSearch();
        }}
        placeholder={t("placeholder.search")!}
        prefix={<SearchOutlined rev={undefined} />}
      />
    </div>
  );
};

export default memo(forwardRef(MessageSearchBar));
