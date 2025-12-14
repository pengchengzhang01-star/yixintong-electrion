import { useEffect } from "react";

import { AboutContent } from "@/layout/LeftNavBar/About";
import { setTMToken } from "@/utils/storage";

export const About = () => {
  const str = window.location.href.split("precheck=")[1];
  const precheck = JSON.parse(decodeURIComponent(str));
  const closeWindow = () => {
    window.electronAPI?.closeWindow("about");
  };

  const init = async () => {
    if (precheck.imToken) {
      await setTMToken(precheck.imToken as string);
    }
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="h-full bg-[var(--chat-bubble)]">
      <AboutContent closeOverlay={closeWindow} />
    </div>
  );
};
