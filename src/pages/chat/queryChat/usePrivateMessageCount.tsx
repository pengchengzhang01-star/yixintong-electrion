import { useLatest } from "ahooks";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { IMSDK } from "@/layout/MainContentWrap";
import { useConversationStore } from "@/store";

import { deleteOneMessage } from "./useHistoryMessageList";

const PrivateMessageCountContext = createContext<
  | {
      counts: Record<string, number | undefined>;
      addDestroyTime: (clientMsgID: string, showTime: number) => void;
    }
  | undefined
>(undefined);

export const PrivateMessageCountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { conversationID } = useParams();
  const [counts, setCounts] = useState<Record<string, number | undefined>>({});
  const latestCounts = useLatest(counts);

  const deletePrivateMessage = (clientMsgID: string) => {
    const currentConversationID =
      useConversationStore.getState().currentConversation?.conversationID;
    if (!currentConversationID) return;
    IMSDK.deleteMessages({
      clientMsgIDs: [clientMsgID],
      conversationID: currentConversationID,
      isSync: false,
    });
    deleteOneMessage(clientMsgID);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      Object.keys(latestCounts.current).map((clientMsgID) => {
        const count = latestCounts.current[clientMsgID];
        if (count && count > 0) {
          setCounts((prev) => ({
            ...prev,
            [clientMsgID]: count - 1,
          }));
        } else {
          setCounts((prev) => {
            const newCounts = { ...prev };
            delete newCounts[clientMsgID];
            return newCounts;
          });
          deletePrivateMessage(clientMsgID);
        }
      });
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    return () => {
      const privateClientMsgIDs = Object.keys(latestCounts.current);
      if (privateClientMsgIDs.length === 0 || !conversationID) return;
      // Delete all private messages when the component unmounts
      IMSDK.deleteMessages({
        clientMsgIDs: privateClientMsgIDs,
        conversationID: conversationID,
        isSync: false,
      });
      setCounts({});
    };
  }, [conversationID]);

  const addDestroyTime = (clientMsgID: string, showTime: number) => {
    if (counts[clientMsgID]) return;
    setCounts((prev) => ({
      ...prev,
      [clientMsgID]: showTime,
    }));
  };

  return (
    <PrivateMessageCountContext.Provider
      value={{
        counts,
        addDestroyTime,
      }}
    >
      {children}
    </PrivateMessageCountContext.Provider>
  );
};

export const usePrivateMessageCount = () => {
  const context = useContext(PrivateMessageCountContext);
  if (context === undefined) {
    throw new Error(
      "usePrivateMessageCount must be used within a PrivateMessageCountProvider",
    );
  }
  return context;
};
