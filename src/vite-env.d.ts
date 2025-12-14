/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string;
  readonly VITE_API_URL: string;
  readonly VITE_CHAT_URL: string;
  readonly VITE_AGENT_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_SDK_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
