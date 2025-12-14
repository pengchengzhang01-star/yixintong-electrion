import type {
  AddFriendPermission,
  MessageReceiveOptType,
} from "@openim/wasm-client-sdk";
import { useMutation } from "react-query";
import { v4 as uuidv4 } from "uuid";

import { getChatUrl } from "@/config";
import { useUserStore } from "@/store";
import createAxiosInstance from "@/utils/request";

import { errorHandle } from "./errorHandle";
import {
  getUserJoinedDep,
  MemberInDepartment,
  UsersWithDepartment,
} from "./organization";

const request = createAxiosInstance(getChatUrl(), false);

const platform = window.electronAPI?.getPlatform() ?? 5;

const getAreaCode = (code?: string) =>
  code ? (code.includes("+") ? code : `+${code}`) : code;

// Send verification code
export const useSendSms = () => {
  return useMutation(
    (params: API.Login.SendSmsParams) =>
      request.post(
        "/account/code/send",
        {
          ...params,
        },
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      ),
    {
      onError: errorHandle,
    },
  );
};

// Verify mobile phone number
export const useVerifyCode = () => {
  return useMutation(
    (params: API.Login.VerifyCodeParams) =>
      request.post(
        "/account/code/verify",
        {
          ...params,
          areaCode: getAreaCode(params.areaCode),
        },
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      ),
    {
      onError: errorHandle,
    },
  );
};

// register
export const useRegister = () => {
  return useMutation(
    (params: API.Login.DemoRegisterType) =>
      request.post<{ chatToken: string; imToken: string; userID: string }>(
        "/account/register",
        {
          ...params,
          user: {
            ...params.user,
            areaCode: getAreaCode(params.user.areaCode),
          },
          platform,
        },
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      ),
    {
      onError: errorHandle,
    },
  );
};

// reset passwords
export const useReset = () => {
  return useMutation(
    (params: API.Login.ResetParams) =>
      request.post(
        "/account/password/reset",
        {
          ...params,
          areaCode: getAreaCode(params.areaCode),
        },
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      ),
    {
      onError: errorHandle,
    },
  );
};

// change password
export const modifyPassword = async (params: API.Login.ModifyParams) => {
  return request.post(
    "/account/password/change",
    {
      ...params,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
};

// log in
export const useLogin = () => {
  return useMutation(
    (params: API.Login.LoginParams) =>
      request.post<{ chatToken: string; imToken: string; userID: string }>(
        "/account/login",
        {
          ...params,
          platform,
          areaCode: getAreaCode(params.areaCode),
        },
        {
          headers: {
            operationID: uuidv4(),
          },
        },
      ),
    {
      onError: errorHandle,
    },
  );
};

// Get user information
export interface BusinessUserInfo {
  userID: string;
  password: string;
  account: string;
  phoneNumber: string;
  areaCode: string;
  email: string;
  nickname: string;
  faceURL: string;
  gender: number;
  level: number;
  birth: number;
  addFriendPermission: AddFriendPermission;
  allowAddFriend: BusinessAllowType;
  allowBeep: BusinessAllowType;
  allowVibration: BusinessAllowType;
  globalRecvMsgOpt: MessageReceiveOptType;
  members?: MemberInDepartment[];
  registerType: RegisterType;
}

export enum RegisterType {
  Account,
  Email,
  PhoneNumber,
}

export enum BusinessAllowType {
  Allow = 1,
  NotAllow = 2,
}

export const getBusinessUserInfo = async (userIDs: string[]) => {
  return request.post<{ users: BusinessUserInfo[] }>(
    "/user/find/full",
    {
      userIDs,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
};

export const searchBusinessUserInfo = async (
  keyword: string,
  pageNumber = 1,
  showNumber = 1,
) => {
  return request.post<{ total: number; users: BusinessUserInfo[] }>(
    "/user/search/full",
    {
      keyword,
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
};

export const searchOrganizationUserInfo = async (
  keyword: string,
  pageNumber = 1,
  showNumber = 20,
) => {
  return request.post<{ total: number; users: BusinessUserInfo[] }>(
    "/user/search/organization/full",
    {
      keyword,
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
};

interface UpdateBusinessUserInfoParams {
  email: string;
  nickname: string;
  faceURL: string;
  gender: number;
  birth: number;
  allowAddFriend: number;
  allowBeep: number;
  allowVibration: number;
  globalRecvMsgOpt: number;
}

export const updateBusinessUserInfo = async (
  params: Partial<UpdateBusinessUserInfoParams>,
) => {
  return request.post<unknown>(
    "/user/update",
    {
      ...params,
      userID: useUserStore.getState().selfInfo?.userID,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
};

export const getBusinessUserInfoWithDepartment = async (userIDs: string[]) => {
  const promises = [getBusinessUserInfo(userIDs), getUserJoinedDep(userIDs)];
  const [{ data: userInfos }, { data: departmentInfos }] = (await Promise.all(
    promises,
  )) as unknown as [
    { data: { users: BusinessUserInfo[] } },
    { data: UsersWithDepartment },
  ];
  return userInfos.users.map((user) => ({
    ...user,
    members: departmentInfos.users.find(
      (item) => item.members[0].userID === user.userID,
    )?.members,
  }));
};

export const deregister = async () => {
  return request.post<unknown>(
    "/user/un_register_user",
    {
      userIDs: [useUserStore.getState().selfInfo?.userID],
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
};

export const oAuthRegister = async (state: string) => {
  return request.post<{ chatToken: string; imToken: string; userID: string }>(
    "/account/register/oauth",
    {
      state,
      platform,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
};

export const oAuthLogin = async (state: string) => {
  return request.post<{ chatToken: string; imToken: string; userID: string }>(
    "/account/login/oauth",
    {
      state,
      platform,
    },
    {
      headers: {
        operationID: uuidv4(),
      },
    },
  );
};
