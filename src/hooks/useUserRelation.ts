import { CbEvents, FriendUserItem, WSEvent } from "@openim/wasm-client-sdk";
import { useEffect, useState } from "react";

import { IMSDK } from "@/layout/MainContentWrap";
import { useContactStore } from "@/store";

export function useUserRelation(userID: string) {
  const storeIsFriend = useContactStore((state) =>
    state.friendList.some((item) => item.userID === userID),
  );
  const [isFriend, setIsFriend] = useState(storeIsFriend);
  const isBlack = useContactStore((state) =>
    state.blackList.some((item) => item.userID === userID),
  );

  useEffect(() => {
    checkUserRelation();
    const friendAddedHandler = ({ data }: WSEvent<FriendUserItem>) => {
      if (data.userID === userID) {
        setIsFriend(true);
      }
    };
    const friendDeletedHandler = ({ data }: WSEvent<FriendUserItem>) => {
      if (data.userID === userID) {
        setIsFriend(false);
      }
    };
    IMSDK.on(CbEvents.OnFriendAdded, friendAddedHandler);
    IMSDK.on(CbEvents.OnFriendDeleted, friendDeletedHandler);
    return () => {
      IMSDK.off(CbEvents.OnFriendAdded, friendAddedHandler);
      IMSDK.off(CbEvents.OnFriendDeleted, friendDeletedHandler);
    };
  }, [userID]);

  const checkUserRelation = async () => {
    if (!userID) return;

    const { data } = await IMSDK.checkFriend([userID]);
    setIsFriend(Boolean(data[0]?.result));
  };

  return {
    isBlack,
    isFriend,
  };
}
