import { menuManager } from './menuManage';
import { app } from "electron";
import { join } from "node:path";
import { createCapturer } from "electron-capturer";
import { isLinux } from "../utils";
import { getLogger } from "../utils/log";
import { initI18n } from "../i18n";
import { t } from "i18next";
import { checkEmojiAssets } from "../utils/extraResourceCheck";
import { windowManager } from "./windowManage";
import { trayManager } from './trayManage';
import { appManager } from './appManage';
import { ipcHandlerManager } from './ipcHandlerManage';

export const logger = getLogger(join(app.getPath("userData"), `/OpenIMData/logs`));

app.setAsDefaultProtocolClient("openim");

const registerCapturer = () => {
  const capturer = createCapturer({
    texts: {
      escHint: t("capturer.escHint"),
      loading: t("capturer.loading"),
      textPlaceholder: t("capturer.textPlaceholder"),
      statusReady: t("capturer.statusReady"),
      toolLabels: {
        select: t("capturer.toolLabels.select"),
        rect: t("capturer.toolLabels.rect"),
        arrow: t("capturer.toolLabels.arrow"),
        pen: t("capturer.toolLabels.pen"),
        text: t("capturer.toolLabels.text"),
        mosaic: t("capturer.toolLabels.mosaic"),
        eraser: t("capturer.toolLabels.eraser"),
      },
      toolbar: {
        color: t("capturer.toolbar.color"),
        strokeWidth: t("capturer.toolbar.strokeWidth"),
        undo: t("capturer.toolbar.undo"),
        redo: t("capturer.toolbar.redo"),
        copy: t("capturer.toolbar.copy"),
        save: t("capturer.toolbar.save"),
        cancel: t("capturer.toolbar.cancel"),
        confirm: t("capturer.toolbar.confirm"),
      },
    },
  });
  capturer.registerIpc();
};

const init = () => {
  initI18n();
  windowManager.createMainWindow();
  menuManager.createMenu();
  trayManager.createTray();
  checkEmojiAssets();
  registerCapturer();
};

appManager.prepare();
ipcHandlerManager.setIpcMainListener();
appManager.setAppListener(init);

app.whenReady().then(() => (isLinux ? setTimeout(init, 300) : init()));
