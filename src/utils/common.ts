import { t } from "i18next";
import { v4 as uuidv4 } from "uuid";

import { message } from "../AntdGlobalComp";
import { useMessageStore } from "@/store";
import { DownloadData } from "@/store/type";
import { MessageArgsProps } from "antd";

type FeedbackToastParams = {
  type?: MessageArgsProps["type"];
  msg?: string | null;
  error?: unknown;
  duration?: number;
  onClose?: () => void;
};

interface FeedbackError extends Error {
  errMsg?: string;
  errDlt?: string;
}
export const feedbackToast = (config?: FeedbackToastParams) => {
  const { type, msg, error, duration, onClose } = config ?? {};
  let content = "";
  if (error) {
    content =
      (error as FeedbackError)?.message ??
      (error as FeedbackError)?.errDlt ??
      t("toast.accessFailed");
  }
  message.open({
    type: error ? "error" : type || "success",
    content: msg ?? content ?? t("toast.accessSuccess"),
    duration,
    onClose,
  });
  if (error) {
    console.error(msg, error);
  }
};

export const canSendImageTypeList = ["png", "jpg", "jpeg", "gif", "bmp", "webp"];

export const bytesToSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024,
    sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = bytes / Math.pow(k, i);
  return `${size % 1 === 0 ? size : size.toFixed(2)} ${sizes[i]}`;
};

export const secondsToTime = (seconds: number) => {
  let minutes = 0; // min
  let hours = 0; // hour
  let days = 0; // day
  if (seconds > 60) {
    minutes = parseInt((seconds / 60) as unknown as string);
    seconds = parseInt((seconds % 60) as unknown as string);
    if (minutes > 60) {
      hours = parseInt((minutes / 60) as unknown as string);
      minutes = parseInt((minutes % 60) as unknown as string);
      if (hours > 24) {
        days = parseInt((hours / 24) as unknown as string);
        hours = parseInt((hours % 24) as unknown as string);
      }
    }
  }
  let result = "";
  if (seconds > 0) {
    result = t("date.second", { num: parseInt(seconds as unknown as string) });
  }
  if (minutes > 0) {
    result = t("date.minute", { num: parseInt(minutes as unknown as string) }) + result;
  }
  if (hours > 0) {
    result = t("date.hour", { num: parseInt(hours as unknown as string) }) + result;
  }
  if (days > 0) {
    result = t("date.day", { num: parseInt(days as unknown as string) }) + result;
  }
  return result;
};

export const secondsToMS = (duration: number) => {
  let minutes = Math.floor(duration / 60) % 60;
  let seconds = (duration % 60).toString();
  minutes = minutes.toString().padStart(2, "0") as unknown as number;
  seconds = seconds.length === 1 ? "0" + seconds : seconds;
  return `${minutes}:${seconds}`;
};

export const filterEmptyValue = (obj: Record<string, unknown>) => {
  for (const key in obj) {
    if (obj[key] === "") {
      delete obj[key];
    }
  }
};

export const checkIsSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export const downloadFile = async (originUrl: string, data: DownloadData) => {
  if (window.electronAPI) {
    try {
      const tmpURL = new URL(originUrl);
      const searchParams = new URLSearchParams(tmpURL.search);
      searchParams.set("save-type", data.saveType ?? "file");
      if (data.randomName) {
        searchParams.set("random-prefix", uuidv4());
      }
      tmpURL.search = searchParams.toString();
      const downloadUrl = tmpURL.toString();
      const hasTask = !!useMessageStore.getState().downloadMap[downloadUrl];
      if (hasTask) return;
      window.electronAPI.startDownload(downloadUrl);
      useMessageStore.getState().addDownloadTask(downloadUrl, {
        ...data,
        originUrl,
        downloadUrl,
        downloadState: "downloading",
      });
    } catch (error) {
      if (data.showError) message.error(t("toast.downloadFailed"));
    }
    return;
  }
  const linkNode = document.createElement("a");
  linkNode.style.display = "none";
  const idx = originUrl.lastIndexOf("/");
  linkNode.download = originUrl.slice(idx + 1);
  linkNode.href = originUrl;
  document.body.appendChild(linkNode);
  linkNode.click();
  document.body.removeChild(linkNode);
};

export const getDownloadTask = ({
  downloadMap,
  compareKey,
  compareValue,
}: {
  downloadMap: Record<string, DownloadData>;
  compareKey: keyof DownloadData;
  compareValue: unknown;
}) => {
  for (const key in downloadMap) {
    if (downloadMap[key][compareKey] === compareValue) {
      return downloadMap[key];
    }
  }
  return null;
};

export const getFileData = (data: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = function () {
      resolve(reader.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(data);
  });
};

export const base64toFile = (base64Str: string) => {
  var arr = base64Str.split(","),
    fileType = arr[0].match(/:(.*?);/)![1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], `screenshot${Date.now()}.png`, {
    type: fileType,
  });
};

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function (evt) {
      const base64 = evt.target?.result;
      resolve(base64 as string);
    };
    reader.readAsDataURL(file);
  });

export const formatBr = (str: string) => str.replace(/\n/g, "<br>");

const longestCommonSubsequence = (str1: string, str2: string) => {
  const dp = Array.from({ length: str1.length + 1 }, () =>
    Array(str2.length + 1).fill(0),
  );

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let lcs = "";
  let i = str1.length;
  let j = str2.length;
  while (i > 0 && j > 0) {
    if (str1[i - 1] === str2[j - 1]) {
      lcs = str1[i - 1] + lcs;
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
};

export const getExtraStr = (str1: string, str2: string) => {
  const lcs = longestCommonSubsequence(str1, str2);
  let extraPart = "";
  let lcsIndex = 0;

  for (let i = 0; i < str2.length; i++) {
    if (lcsIndex < lcs.length && str2[i] === lcs[lcsIndex]) {
      lcsIndex++;
    } else {
      extraPart += str2[i];
    }
  }

  return extraPart.slice(1);
};

export const getFileType = (name: string) => {
  const idx = name.lastIndexOf(".");
  return name.slice(idx + 1);
};

export const generateAvatar = (str: string, size = 40) => {
  str = !str ? t("placeholder.unknown") : str.split("")[0];
  let colors = ["#0072E3"];
  let cvs = document.createElement("canvas");
  cvs.setAttribute("width", size as unknown as string);
  cvs.setAttribute("height", size as unknown as string);
  let ctx = cvs.getContext("2d");
  ctx!.fillStyle = colors[Math.floor(Math.random() * colors.length)];
  ctx!.fillRect(0, 0, size, size);
  ctx!.fillStyle = "rgb(255,255,255)";
  ctx!.font = size * 0.4 + "px Arial";
  ctx!.textBaseline = "middle";
  ctx!.textAlign = "center";
  ctx!.fillText(str, size / 2, size / 2);
  return cvs.toDataURL("image/png", 1);
};

export async function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * Escapes HTML special characters to prevent HTML injection
 * @param text - The text to escape
 * @returns The escaped text
 */
export function escapeHtml(text: string): string {
  if (!text) return "";

  const placeholders: string[] = [];
  const PLACEHOLDER_PREFIX = "__HTML_PLACEHOLDER_";
  let sanitizedText = text;

  const storePlaceholder = (fragment: string) => {
    const placeholder = `${PLACEHOLDER_PREFIX}${placeholders.length}__`;
    placeholders.push(fragment);
    return placeholder;
  };

  const preserveMentionsWithoutDom = (raw: string) => {
    const mentionPattern =
      /<span\b[^>]*class=["'][^"']*\bim-mention-blot\b[^"']*["'][^>]*>/gi;
    const lowerRaw = raw.toLowerCase();
    let rebuilt = "";
    let lastIndex = 0;

    const extractMentionSpan = (startIndex: number) => {
      let cursor = startIndex;
      let depth = 0;
      while (cursor < raw.length) {
        if (lowerRaw.startsWith("<span", cursor)) {
          depth++;
          const closeIdx = raw.indexOf(">", cursor);
          if (closeIdx === -1) return null;
          cursor = closeIdx + 1;
          continue;
        }
        if (lowerRaw.startsWith("</span>", cursor)) {
          depth--;
          cursor += 7;
          if (depth === 0) {
            return cursor;
          }
          continue;
        }
        cursor++;
      }
      return null;
    };

    let match: RegExpExecArray | null;
    while ((match = mentionPattern.exec(raw)) !== null) {
      const start = match.index;
      const spanEnd = extractMentionSpan(start);
      if (!spanEnd) {
        continue;
      }
      const fragment = raw.slice(start, spanEnd);
      const placeholder = storePlaceholder(fragment);
      rebuilt += raw.slice(lastIndex, start) + placeholder;
      lastIndex = spanEnd;
      mentionPattern.lastIndex = spanEnd;
    }

    if (lastIndex > 0) {
      rebuilt += raw.slice(lastIndex);
      return rebuilt;
    }
    return raw;
  };

  const preserveEmojiWithoutDom = (raw: string) => {
    const emojiPattern = /<img\b[^>]*class=["'][^"']*\bemojione\b[^"']*["'][^>]*>/gi;
    return raw.replace(emojiPattern, (match) => storePlaceholder(match));
  };

  const containsMention = sanitizedText.includes("im-mention-blot");
  const containsEmoji = sanitizedText.includes("emojione");

  if ((containsMention || containsEmoji) && typeof document !== "undefined") {
    const container = document.createElement("div");
    container.innerHTML = sanitizedText;
    const targetNodes = Array.from(
      container.querySelectorAll("span.im-mention-blot, img.emojione, img.im-emojione"),
    );
    targetNodes.forEach((node) => {
      const placeholder = storePlaceholder((node as HTMLElement).outerHTML);
      node.outerHTML = placeholder;
    });
    sanitizedText = container.innerHTML;
  } else {
    if (containsMention) {
      sanitizedText = preserveMentionsWithoutDom(sanitizedText);
    }
    if (containsEmoji) {
      sanitizedText = preserveEmojiWithoutDom(sanitizedText);
    }
  }

  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  // Do not escape '/' so that URL patterns remain linkifiable after escaping
  let escaped = sanitizedText.replace(/[&<>"']/g, (char) => map[char] || char);

  placeholders.forEach((fragment, index) => {
    const placeholder = `${PLACEHOLDER_PREFIX}${index}__`;
    escaped = escaped.replace(placeholder, fragment);
  });

  return escaped;
}
