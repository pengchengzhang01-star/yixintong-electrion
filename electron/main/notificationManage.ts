import { Notification } from "electron";
import { t } from "i18next";
import { NewMessageSummary } from "../../src/types/globalExpose";


export type NotificationClickHandler = (conversationId: string | null) => void;

export class NotificationManager {
  private readonly AGGREGATION_WINDOW_MS: number;
  private readonly RATE_LIMIT_WINDOW_MS: number;
  private readonly RATE_LIMIT_MAX_COUNT: number;
  private readonly CLOSE_PREVIOUS_BEFORE_SHOW = true;

  private notifyTimes: number[] = [];
  private pendingByConversation = new Map<
    string,
    { count: number; lastMsg: NewMessageSummary | null; timer: NodeJS.Timeout | null }
  >();

  private lastNotification: Notification | null = null;

  private globalUnreadCount = 0;
  private globalNotification: Notification | null = null;

  private platform: NodeJS.Platform = process.platform;
  private onClickHandler: NotificationClickHandler | null = null;

  constructor(options?: {
    aggregationWindowMs?: number;
    rateLimitWindowMs?: number;
    rateLimitMaxCount?: number;
  }) {
    this.AGGREGATION_WINDOW_MS = options?.aggregationWindowMs ?? 3000;
    this.RATE_LIMIT_WINDOW_MS = options?.rateLimitWindowMs ?? 5000;
    this.RATE_LIMIT_MAX_COUNT = options?.rateLimitMaxCount ?? 10;
  }

  setClickHandler = (handler: NotificationClickHandler) => {
    this.onClickHandler = handler;
  }

  handleNewMessage = (msg: NewMessageSummary) => {
    if (!this.canNotify()) return;

    if (msg.isRtc) {
      const callTitle = t("notification.callInvitationTitle");
      if (this.platform === "linux") {
        this.showGlobalNotification({
          title: callTitle,
          body: msg.text,
        });
      } else {
        this.showNotification({
          title: callTitle,
          body: msg.text,
          conversationId: "",
        });
      }
      return;
    }

    if (this.platform === "linux") {
      this.pushLinuxGlobalSummary(msg);
    } else {
      this.pushPerConversation(msg);
    }
  }

  private canNotify(): boolean {
    const now = Date.now();
    while (this.notifyTimes.length && now - this.notifyTimes[0] > this.RATE_LIMIT_WINDOW_MS) {
      this.notifyTimes.shift();
    }

    if (this.notifyTimes.length >= this.RATE_LIMIT_MAX_COUNT) {
      return false;
    }

    this.notifyTimes.push(now);
    return true;
  }

  private pushPerConversation(msg: NewMessageSummary) {
    const convId = msg.conversationId;
    let pending = this.pendingByConversation.get(convId);

    if (!pending) {
      pending = {
        count: 0,
        lastMsg: null,
        timer: null,
      };
      this.pendingByConversation.set(convId, pending);
    }

    pending.count += 1;
    pending.lastMsg = msg;

    if (pending.timer) return;

    pending.timer = setTimeout(() => {
      this.flushConversation(convId, pending!);
      this.pendingByConversation.delete(convId);
    }, this.AGGREGATION_WINDOW_MS);
  }

  private flushConversation(
    convId: string,
    pending: { count: number; lastMsg: NewMessageSummary | null; timer: NodeJS.Timeout | null },
  ) {
    const { count, lastMsg } = pending;
    if (!lastMsg) return;

    const msg = lastMsg.isGroup ? `${lastMsg.senderName}: ${lastMsg.text}` : lastMsg.text;
    const body = count === 1 ? msg : t("notification.newMessagesWithLatest", { count, msg });

    this.showNotification({
      title: lastMsg.conversationName,
      body,
      conversationId: convId,
    });
  }

  private pushLinuxGlobalSummary(msg: NewMessageSummary) {
    this.globalUnreadCount += 1;

    const title = t("notification.newMessageTitle");
    const body =
      this.globalUnreadCount === 1
        ? t("notification.linuxSingleSummary", {
            sender: msg.senderName,
            text: msg.text,
          })
        : t("notification.linuxMultipleSummary", {
            count: this.globalUnreadCount,
            sender: msg.senderName,
            text: msg.text,
          });

    this.showGlobalNotification({ title, body });
  }

  private showGlobalNotification(args: { title: string; body: string }) {
    if (this.globalNotification) {
      try {
        this.globalNotification.close();
      } catch {
        // ignore
      }
      this.globalNotification = null;
    }

    const n = new Notification({
      title: args.title,
      body: args.body,
      silent: false,
    });

    this.globalNotification = n;

    n.on("click", () => {
      this.onClickHandler?.(null);
      try {
        n.close();
      } catch {
        // ignore
      }
      this.globalNotification = null;
      this.globalUnreadCount = 0;
    });

    n.on("close", () => {
      if (this.globalNotification === n) {
        this.globalNotification = null;
      }
    });

    n.show();
  }

  private showNotification(args: { title: string; body: string; conversationId: string }) {
    if (this.CLOSE_PREVIOUS_BEFORE_SHOW && this.lastNotification) {
      try {
        this.lastNotification.close();
      } catch {
        // ignore
      }
      this.lastNotification = null;
    }

    const n = new Notification({
      title: args.title,
      body: args.body,
      silent: false,
    });

    this.lastNotification = n;
    const convId = args.conversationId;

    n.on("click", () => {
      this.onClickHandler?.(convId);
      try {
        n.close();
      } catch {
        // ignore
      }
      if (this.lastNotification === n) {
        this.lastNotification = null;
      }
    });

    n.on("close", () => {
      if (this.lastNotification === n) {
        this.lastNotification = null;
      }
    });

    n.show();
  }
}

export const notificationManager = new NotificationManager();
