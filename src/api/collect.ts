import { v4 as uuidv4 } from "uuid";

import { getChatUrl } from "@/config";
import { useUserStore } from "@/store";
import createAxiosInstance from "@/utils/request";

const request = createAxiosInstance(getChatUrl(), false);

export const addCollectRecord = async (id: string, content: string) => {
  const resp = await request.post<API.Collect.AddCollectResp>(
    "/collect/add",
    {
      uuid: id,
      userID: useUserStore.getState().selfInfo.userID,
      collectType: "msg", // Assuming 3 is the type for message collect
      content,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
  return resp.data;
};

export const delCollectRecord = async (ids: string[]) => {
  const resp = await request.post<unknown>(
    "/collect/del",
    {
      collectIDs: ids,
      userID: useUserStore.getState().selfInfo.userID,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
  return resp.data;
};

export const getCollectRecords = async (pageNumber = 1, showNumber = 20) => {
  const resp = await request.post<API.Collect.GetCollectResp>(
    "/collect/list",
    {
      userID: useUserStore.getState().selfInfo.userID,
      collectTypes: ["msg"],
      pagination: {
        pageNumber,
        showNumber,
      },
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
  return resp.data;
};
