import { CbEvents } from "@openim/wasm-client-sdk";
import { FriendUserItem, WSEvent } from "@openim/wasm-client-sdk/lib/types/entity";
import { useEffect, useRef, useState } from "react";

import { useElectronDownloadHandler, useElectronEvent } from "@/hooks/useEventTransfer";
import { OverlayVisibleHandle } from "@/hooks/useOverlayVisible";
import { IMSDK } from "@/layout/MainContentWrap";
import ChooseModal, { ChooseModalState } from "@/pages/common/ChooseModal";
import { MomentsContent, RouteTravel } from "@/pages/common/MomentsModal";
import { useContactStore, useUserStore } from "@/store";
import emitter from "@/utils/events";
import { setChatToken } from "@/utils/storage";

export const Moments = () => {
  const str = window.location.href.split("precheck=")[1];
  const precheck = JSON.parse(decodeURIComponent(str));

  useElectronEvent();
  useElectronDownloadHandler();

  const chooseModalRef = useRef<OverlayVisibleHandle>(null);
  const [chooseModalState, setChooseModalState] = useState<ChooseModalState>({
    type: "CRATE_GROUP",
  });
  const [momentModalState, setMomentModalState] = useState<RouteTravel>({
    userID: "",
    nickname: "",
    faceURL: "",
  });

  const closeOverlay = () => {
    window.electronAPI?.closeWindow("moments");
  };

  const { getSelfInfoByReq, initImageCache, getWorkMomentsUnreadCount } =
    useUserStore.getState();
  const { getFriendListByReq, updateFriend, pushNewFriend } =
    useContactStore.getState();

  const chooseModalHandler = (params: ChooseModalState) => {
    setChooseModalState({ ...params });
    chooseModalRef.current?.openOverlay();
  };

  const customMessageHandler = ({
    data: { key },
  }: WSEvent<{ key: string; data: string }>) => {
    if (key.includes("wm_")) {
      getWorkMomentsUnreadCount();
    }
  };

  const friednInfoChangeHandler = ({ data }: WSEvent<FriendUserItem>) => {
    updateFriend(data);
  };

  const friednAddedHandler = ({ data }: WSEvent<FriendUserItem>) => {
    pushNewFriend(data);
  };

  const friednDeletedHandler = ({ data }: WSEvent<FriendUserItem>) => {
    updateFriend(data, true);
  };

  const setMomentsUser = (params: RouteTravel) => {
    setMomentModalState(params);
  };

  const initStoreage = async () => {
    const cache =
      (window.electronAPI?.getKeyStoreSync({
        key: "media_cache_record",
      }) as Record<string, string>) || {};
    initImageCache(cache);

    if (precheck.token) {
      await setChatToken(precheck.token as string);
      getSelfInfoByReq();
      getFriendListByReq();
      getWorkMomentsUnreadCount();
    }
    if (precheck.user) {
      setMomentModalState(precheck.user as RouteTravel);
    }
  };

  useEffect(() => {
    initStoreage();

    emitter.on("OPEN_CHOOSE_MODAL", chooseModalHandler);
    emitter.on("SET_MOMENTS_USER", setMomentsUser);
    IMSDK.on(CbEvents.OnRecvCustomBusinessMessage, customMessageHandler);
    IMSDK.on(CbEvents.OnFriendInfoChanged, friednInfoChangeHandler);
    IMSDK.on(CbEvents.OnFriendAdded, friednAddedHandler);
    IMSDK.on(CbEvents.OnFriendDeleted, friednDeletedHandler);
    return () => {
      emitter.off("OPEN_CHOOSE_MODAL", chooseModalHandler);
      emitter.off("SET_MOMENTS_USER", setMomentsUser);
      IMSDK.off(CbEvents.OnRecvCustomBusinessMessage, customMessageHandler);
      IMSDK.off(CbEvents.OnFriendInfoChanged, friednInfoChangeHandler);
      IMSDK.off(CbEvents.OnFriendAdded, friednAddedHandler);
      IMSDK.off(CbEvents.OnFriendDeleted, friednDeletedHandler);
    };
  }, []);

  return (
    <div className="h-[668px]">
      <ChooseModal ref={chooseModalRef} state={chooseModalState} />
      <MomentsContent
        isOverlayOpen={true}
        closeOverlay={closeOverlay}
        baseUser={momentModalState}
      />
    </div>
  );
};
