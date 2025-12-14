// WS 10001 API 10002 CHAT 10008

import { LogLevel } from "@openim/wasm-client-sdk";

// 从环境变量读取配置
export const WS_URL = import.meta.env.VITE_WS_URL;
export const API_URL = import.meta.env.VITE_API_URL;
export const CHAT_URL = import.meta.env.VITE_CHAT_URL;
export const AGENT_URL = import.meta.env.VITE_AGENT_URL;
export const LOG_LEVEL = LogLevel.Verbose;

// 应用信息从环境变量读取
export const APP_NAME = import.meta.env.VITE_APP_NAME;
export const APP_VERSION = import.meta.env.VITE_APP_VERSION;
export const SDK_VERSION = import.meta.env.VITE_SDK_VERSION;

export const getWsUrl = () => localStorage.getItem("wsUrl") || WS_URL;
export const getApiUrl = () => localStorage.getItem("apiUrl") || API_URL;
export const getChatUrl = () => localStorage.getItem("chatUrl") || CHAT_URL;
export const getAgentUrl = () => localStorage.getItem("agentUrl") || AGENT_URL;
export const getLogLevel = () =>
  JSON.parse(localStorage.getItem("logLevel") ?? LOG_LEVEL.toString()) as LogLevel;
export const isSaveLog = process.env.NODE_ENV !== "development";
