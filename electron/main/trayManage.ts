import { app, Menu, Tray } from "electron";
import { t } from "i18next";
import { windowManager } from "./windowManage";
import path from "path";
import { isWin } from "../utils";

class TrayManager {
  private tray: Tray | null = null;
  private timer: NodeJS.Timeout | null = null;
  trayIconPath: string = "";
  emptyIconPath: string = "";

  createTray = () => {
    this.trayIconPath = path.join(global.pathConfig.publicPath, `/icons/${isWin ? "icon.ico" : "tray.png"}`);
    this.emptyIconPath = path.join(global.pathConfig.publicPath, "/icons/empty_tray.png")

    const trayMenu = Menu.buildFromTemplate([
      {
        label: t("system.showWindow"),
        click: windowManager.showWindow,
      },
      {
        label: t("system.hideWindow"),
        click: windowManager.hideWindow,
      },
      {
        label: t("system.quit"),
        click: () => {
          global.forceQuit = true;
          app.quit();
        },
      },
    ]);
    this.tray = new Tray(this.trayIconPath);
    this.tray.setToolTip(app.getName());
    this.tray.setIgnoreDoubleClickEvents(true);
    this.tray.on("click", windowManager.showWindow);

    this.tray.setContextMenu(trayMenu);
  }

  destroyTray = () => {
    if (!this.tray || this.tray.isDestroyed()) return;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.tray.destroy();
    this.tray = null;
  }

  setTrayTitle = (num: number) => {
    if (!this.tray || this.tray.isDestroyed()) {
      return;
    }
    this.tray.setTitle(num === 0 ? "" : num > 99 ? "99+" : num + "");
  }

  flicker = (isFlicker: boolean) => {
    if (!this.tray || this.tray.isDestroyed()) {
      return;
    }
    if (process.platform === "darwin") return;
    if (isFlicker) {
      if (this.timer !== null) return;
      let count = 0;
      this.timer = setInterval(() => {
        if (!this.tray || this.tray.isDestroyed()) {
          clearInterval(this.timer as NodeJS.Timeout);
          this.timer = null;
          return;
        }
        count++;
        try {
          if (count % 2 === 0) {
            this.tray.setImage(this.emptyIconPath);
          } else {
            this.tray.setImage(this.trayIconPath);
          }
        } catch (error) {
          console.log(error);
        }
      }, 500);
    } else {
      clearInterval(this.timer as NodeJS.Timeout);
      this.timer = null;
      try {
        this.tray.setImage(this.trayIconPath);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

export const trayManager = new TrayManager();