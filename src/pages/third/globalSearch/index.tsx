import "./index.scss";

import { CloseOutlined } from "@ant-design/icons";
import { useKeyPress } from "ahooks";
import { useEffect } from "react";

import { useElectronDownloadHandler } from "@/hooks/useEventTransfer";
import { GlobalSearchContent } from "@/pages/common/GlobalSearchModal";
import { setChatToken } from "@/utils/storage";

export const GlobalSearch = () => {
  const str = window.location.href.split("precheck=")[1];
  const precheck = JSON.parse(decodeURIComponent(str));

  useEffect(() => {
    if (precheck.token) {
      setChatToken(precheck.token as string);
    }
  }, []);

  const closeOverlay = () => {
    // null function
  };

  useElectronDownloadHandler();
  useKeyPress(27, () => {
    window.electronAPI?.closeWindow("global-search");
  });

  return (
    <div className="single-search-window relative">
      <div className="app-drag flex justify-end px-5 pt-2">
        <CloseOutlined
          className="app-no-drag cursor-pointer"
          onClick={() => {
            window.electronAPI?.closeWindow("global-search");
          }}
        />
      </div>
      <GlobalSearchContent
        closeOverlay={closeOverlay}
        isOrganizationMember={precheck.isOrganizationMember}
      />
    </div>
  );
};
