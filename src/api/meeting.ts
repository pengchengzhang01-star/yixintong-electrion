import { useMutation } from "react-query";

import { getApiUrl } from "@/config";
import {
  BookMeetingReq,
  BookMeetingResp,
  CreateImmediateMeetingReq,
  CreateImmediateMeetingResp,
  EndMeetingReq,
  GetMeetingReq,
  GetMeetingResp,
  GetMeetingsReq,
  GetMeetingsResp,
  GetMeetingTokenReq,
  GetMeetingTokenResp,
  GetPersonalMeetingSettingsReq,
  GetPersonalMeetingSettingsResp,
  JoinMeetingReq,
  JoinMeetingResp,
  LeaveMeetingReq,
  OperateRoomAllStreamReq,
  OperateRoomAllStreamResp,
  SetPersonalMeetingSettingsReq,
  UpdateMeetingRequest,
} from "@/pb/meeting.pb";
import createAxiosInstance from "@/utils/request";

import { errorHandle, joinMeetingErrorHandle } from "./errorHandle";

const request = createAxiosInstance(getApiUrl());

export const useBookMeeting = () => {
  return useMutation(
    (params: BookMeetingReq) =>
      request.post<BookMeetingResp>("/rtc-meeting/book_meeting", params),
    {
      onError: errorHandle,
    },
  );
};

export const useJoinMeeting = () => {
  return useMutation(
    (params: JoinMeetingReq) =>
      request.post<JoinMeetingResp>("/rtc-meeting/join_meeting", params),
    {
      onError: joinMeetingErrorHandle,
    },
  );
};

export const useLeaveMeeting = () => {
  return useMutation(
    (params: LeaveMeetingReq) => request.post("/rtc-meeting/leave_meeting", params),
    {
      onError: errorHandle,
    },
  );
};

export const useUpdateMeeting = () => {
  return useMutation(
    (params: UpdateMeetingRequest) =>
      request.post("/rtc-meeting/update_meeting", params),
    {
      onError: errorHandle,
    },
  );
};

export const useCreateImmediateMeeting = () => {
  return useMutation(
    (params: CreateImmediateMeetingReq) =>
      request.post<CreateImmediateMeetingResp>(
        "/rtc-meeting/create_immediate_meeting",
        params,
      ),
    {
      onError: joinMeetingErrorHandle,
    },
  );
};

export const useGetMeeting = () => {
  return useMutation(
    (params: GetMeetingReq) =>
      request.post<GetMeetingResp>("/rtc-meeting/get_meeting", params),
    {
      onError: errorHandle,
    },
  );
};

export const useGetMeetings = () => {
  return useMutation(
    (params: GetMeetingsReq) =>
      request.post<GetMeetingsResp>("/rtc-meeting/get_meetings", params),
    {
      onError: errorHandle,
    },
  );
};

export const useEndMeeting = () => {
  return useMutation(
    (params: EndMeetingReq) => request.post("/rtc-meeting/end_meeting", params),
    {
      onError: errorHandle,
    },
  );
};

export const useSetPersonalSetting = () => {
  return useMutation(
    (params: SetPersonalMeetingSettingsReq) =>
      request.post("/rtc-meeting/set_personal_setting", params),
    {
      onError: errorHandle,
    },
  );
};

export const useGetPersonalSetting = () => {
  return useMutation(
    (params: GetPersonalMeetingSettingsReq) =>
      request.post<GetPersonalMeetingSettingsResp>(
        "/rtc-meeting/get_personal_setting",
        params,
      ),
    {
      onError: errorHandle,
    },
  );
};

export const useUpdateMuteAllState = () => {
  return useMutation(
    (params: OperateRoomAllStreamReq) =>
      request.post<OperateRoomAllStreamResp>(
        "/rtc-meeting/operate_meeting_all_stream",
        params,
      ),
    {
      onError: errorHandle,
    },
  );
};

export const useGetMeetingToken = () => {
  return useMutation(
    (params: GetMeetingTokenReq) =>
      request.post<GetMeetingTokenResp>("/rtc-meeting/get_meeting_token", params),
    {
      onError: errorHandle,
    },
  );
};
