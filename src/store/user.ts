import { t } from "i18next";
import { create } from "zustand";

import { BusinessUserInfo, getBusinessUserInfoWithDepartment } from "@/api/login";
import { getMomentsUnreadCount } from "@/api/moments";
import { getOrgnizationInfo, OrganizationInfo } from "@/api/organization";
import { IMSDK } from "@/layout/MainContentWrap";
import router from "@/routes";
import { feedbackToast } from "@/utils/common";
import { emitToSpecifiedWindow } from "@/utils/events";
import { clearIMProfile, getLocale, setImageCache, setLocale } from "@/utils/storage";

import { useContactStore } from "./contact";
import { useConversationStore } from "./conversation";
import { AppSettings, IMConnectState, UserStore } from "./type";

export const useUserStore = create<UserStore>()((set, get) => ({
  syncState: "success",
  progress: 0,
  reinstall: true,
  isLogining: false,
  connectState: "success",
  selfInfo: {} as BusinessUserInfo,
  organizationInfo: {} as OrganizationInfo,
  appSettings: {
    locale: getLocale(),
    closeAction: "miniSize",
  },
  imageCache: {} as Record<string, string>,
  workMomentsUnreadCount: 0,
  updateSyncState: (syncState: IMConnectState) => {
    set({ syncState });
  },
  updateProgressState: (progress: number) => {
    set({ progress });
  },
  updateReinstallState: (reinstall: boolean) => {
    set({ reinstall });
  },
  updateIsLogining: (isLogining: boolean) => {
    set({ isLogining });
  },
  updateConnectState: (connectState: IMConnectState) => {
    set({ connectState });
  },
  getSelfInfoByReq: async () => {
    try {
      const { data } = await IMSDK.getSelfUserInfo();
      set(() => ({ selfInfo: data as unknown as BusinessUserInfo }));
      try {
        const promiseArr = [
          getBusinessUserInfoWithDepartment([data.userID]),
          getOrgnizationInfo(),
        ];
        const [users, { data: organizationInfo }] = (await Promise.all(promiseArr)) as [
          BusinessUserInfo[],
          { data: OrganizationInfo },
        ];
        set((state) => ({
          selfInfo: {
            ...state.selfInfo,
            ...(users[0] ?? {}),
          },
          organizationInfo: organizationInfo ?? {},
        }));
      } catch (error) {
        console.error("get self info by req err", error);
      }
    } catch (error) {
      feedbackToast({ error, msg: t("toast.getSelfInfoFailed") });
      emitToSpecifiedWindow("USER_LOGOUT");
    }
  },
  updateSelfInfo: (info: Partial<BusinessUserInfo>) => {
    set((state) => ({ selfInfo: { ...state.selfInfo, ...info } }));
  },
  updateAppSettings: (settings: Partial<AppSettings>) => {
    if (settings.locale) {
      setLocale(settings.locale);
    }
    set((state) => ({ appSettings: { ...state.appSettings, ...settings } }));
  },
  userLogout: async (force?: boolean) => {
    if (!force) await IMSDK.logout();
    clearIMProfile();
    set({ selfInfo: {} as BusinessUserInfo, progress: 0 });
    useContactStore.getState().clearContactStore();
    useConversationStore.getState().clearConversationStore();
    window.electronAPI?.updateUnreadCount(0);
    window.electronAPI?.clearChildWindows();
    router.navigate("/login");
  },
  getWorkMomentsUnreadCount: async () => {
    try {
      const { data } = await getMomentsUnreadCount();
      set({ workMomentsUnreadCount: data.total });
    } catch (error) {
      console.error("get work moments unread count err");
    }
  },
  updateWorkMomentsUnreadCount: (count = 0) => {
    set({ workMomentsUnreadCount: count });
  },
  initImageCache: (cache: Record<string, string>) => {
    set(() => ({ imageCache: cache }));
  },
  addImageCache: (url: string, path: string) => {
    const newCache = { ...get().imageCache };
    newCache[url] = path;
    setImageCache(newCache);
    set(() => ({ imageCache: newCache }));
  },
  clearImageCache: () => {
    setImageCache({});
    set({ imageCache: {} });
  },
}));
