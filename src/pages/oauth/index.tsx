import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { oAuthLogin, oAuthRegister } from "@/api/login";
import { setIMProfile } from "@/utils/storage";

export function OAuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    handleOAuth();
  }, []);

  const handleOAuth = async () => {
    if (window.electronAPI) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const oauth_state = params.get("oauth_state");
    const oauth_registered = params.get("oauth_registered");
    if (!oauth_state || !oauth_registered) {
      navigate("/login");
      return;
    }

    const func = oauth_registered === "true" ? oAuthLogin : oAuthRegister;
    try {
      const data = await func(oauth_state);
      const { chatToken, imToken, userID } = data.data;
      setIMProfile({ chatToken, imToken, userID });
      window.history.replaceState(null, "", window.location.pathname);
      navigate("/chat", { replace: true });
    } catch (error) {
      navigate("/login");
    }
  };

  return <div>loading...</div>;
}
