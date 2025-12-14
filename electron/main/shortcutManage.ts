import { windowManager } from './windowManage';
import { globalShortcut } from "electron";

class ShortcutManager {
  register = () => {
    globalShortcut.register("CmdOrCtrl+F12", windowManager.toggleDevTools);
  }

  unregisterAll = () => {
    globalShortcut.unregisterAll();
  }
}

export const shortcutManager = new ShortcutManager();
