import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "react-query";
import { v4 as uuidv4 } from "uuid";

import { getChatUrl } from "@/config";
import { useUserStore } from "@/store";
import { WorkMoments, WorkMomentsResponse } from "@/types/moment";
import createAxiosInstance from "@/utils/request";

const request = createAxiosInstance(getChatUrl(), false);

// 发布朋友圈
export const usePublishMoments = (queryKey?: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    (params: API.Moments.PublishMomentsParams) =>
      request.post("/office/work_moment/add", {
        ...params,
      }),
    { onSuccess: () => queryClient.invalidateQueries(queryKey ?? "SelfMoments") },
  );
};

// 获取自己的朋友圈
export const fetchUserMoments = async (
  { pageParam = 1 },
  userID?: string,
): Promise<WorkMoments[]> => {
  const url = `/office/work_moment/find/${!userID ? "recv" : "send"}`;
  try {
    const { data } = await request.post<WorkMomentsResponse>(url, {
      userID,
      pagination: {
        pageNumber: pageParam,
        showNumber: 20,
      },
    });
    return data.workMoments;
  } catch (error) {
    return [];
  }
};

export const useUserMoments = (enabled: boolean, queryKey?: string) => {
  return useInfiniteQuery<WorkMoments[]>(
    queryKey ?? "SelfMoments",
    (context) => fetchUserMoments(context, queryKey),
    {
      getNextPageParam: (lastPage, pages) =>
        lastPage?.length < 20 ? undefined : pages.length + 1,
      enabled,
    },
  );
};

// 获取单条朋友圈
export const getMomentsByID = (workMomentID: string) =>
  request.post<{ workMoment: WorkMoments }>("/office/work_moment/get", {
    workMomentID,
  });

// 删除朋友圈
export const useDeleteMoments = (queryKey?: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    (workMomentID: string) =>
      request.post("/office/work_moment/del", {
        workMomentID,
      }),
    {
      onMutate: (updatedData) => {
        const previousData = queryClient.getQueryData<
          InfiniteData<WorkMoments[]> | undefined
        >(queryKey ?? "SelfMoments");
        queryClient.setQueryData<InfiniteData<WorkMoments[]> | undefined>(
          queryKey ?? "SelfMoments",
          (oldData) => {
            if (!oldData) return oldData;
            const newPages = oldData.pages.map((page) => {
              return page.filter((item) => item.workMomentID !== updatedData);
            });
            return {
              ...oldData,
              pages: newPages,
            };
          },
        );
        return previousData;
      },
      onError: (_, __, context) => {
        queryClient.setQueryData(queryKey ?? "SelfMoments", context);
      },
      onSuccess: () => queryClient.invalidateQueries(queryKey ?? "SelfMoments"),
    },
  );
};

export const useCreateComment = (queryKey?: string) => {
  const queryClient = useQueryClient();
  const selfInfo = useUserStore.getState().selfInfo;
  return useMutation(
    (params: API.Moments.CreateCommentParams) =>
      request.post("/office/work_moment/comment/add", {
        ...params,
      }),
    {
      onMutate: (updatedData) => {
        const previousData = queryClient.getQueryData<
          InfiniteData<WorkMoments[]> | undefined
        >(queryKey ?? "SelfMoments");
        queryClient.setQueryData<InfiniteData<WorkMoments[]> | undefined>(
          queryKey ?? "SelfMoments",
          (oldData) => {
            if (!oldData) return oldData;
            const newPages = oldData.pages.map((page) => {
              return page.map((item) => {
                if (item.workMomentID !== updatedData.workMomentID) return item;
                const newComment = {
                  userID: selfInfo.userID,
                  nickname: selfInfo.nickname,
                  faceURL: selfInfo.faceURL,
                  commentID: uuidv4(),
                  content: updatedData.content,
                  createTime: new Date().getTime(),
                  replyFaceURL: "",
                  replyNickname: updatedData.replyUserName,
                  replyUserID: updatedData.replyUserID,
                };
                const updatedComments = item.comments
                  ? [...item.comments, newComment]
                  : [newComment];
                return { ...item, comments: updatedComments };
              });
            });
            return {
              ...oldData,
              pages: newPages,
            };
          },
        );
        return previousData;
      },
      onError: (_, __, context) => {
        queryClient.setQueryData(queryKey ?? "SelfMoments", context);
      },
    },
  );
};

// delete comment
export const useDeleteComment = (queryKey?: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    (params: API.Moments.DeleteCommentParams) =>
      request.post("/office/work_moment/comment/del", {
        ...params,
      }),
    {
      onMutate: (updatedData) => {
        const previousData = queryClient.getQueryData<
          InfiniteData<WorkMoments[]> | undefined
        >(queryKey ?? "SelfMoments");
        queryClient.setQueryData<InfiniteData<WorkMoments[]> | undefined>(
          queryKey ?? "SelfMoments",
          (oldData) => {
            if (!oldData) return oldData;
            const newPages = oldData.pages.map((page) => {
              return page.map((item) => {
                if (item.workMomentID !== updatedData.workMomentID) return item;
                const newItem = { ...item };
                newItem.comments = newItem.comments?.filter(
                  (comment) => comment.commentID !== updatedData.commentID,
                );
                return newItem;
              });
            });
            return {
              ...oldData,
              pages: newPages,
            };
          },
        );
        return previousData;
      },
      onError: (_, __, context) => {
        queryClient.setQueryData(queryKey ?? "SelfMoments", context);
      },
    },
  );
};

// like
export const useLikeMoments = (queryKey?: string) => {
  const queryClient = useQueryClient();
  const selfInfo = useUserStore.getState().selfInfo;
  return useMutation(
    (params: { workMomentID: string; like: boolean }) =>
      request.post("/office/work_moment/like", {
        ...params,
      }),
    {
      onMutate: (updatedData) => {
        const previousData = queryClient.getQueryData<
          InfiniteData<WorkMoments[]> | undefined
        >(queryKey ?? "SelfMoments");
        queryClient.setQueryData<InfiniteData<WorkMoments[]> | undefined>(
          queryKey ?? "SelfMoments",
          (oldData) => {
            if (!oldData) return oldData;
            const newPages = oldData.pages.map((page) => {
              return page.map((item) => {
                if (item.workMomentID !== updatedData.workMomentID) return item;
                const newItem = { ...item };
                if (updatedData.like) {
                  newItem.likeUsers = newItem.likeUsers
                    ? [
                        ...newItem.likeUsers,
                        { ...selfInfo, likeTime: new Date().getTime() },
                      ]
                    : [{ ...selfInfo, likeTime: new Date().getTime() }];
                } else {
                  newItem.likeUsers = newItem.likeUsers?.filter(
                    (user) => user.userID !== selfInfo.userID,
                  );
                }
                return newItem;
              });
            });
            return {
              ...oldData,
              pages: newPages,
            };
          },
        );
        return previousData;
      },
      onError: (_, __, context) => {
        queryClient.setQueryData(queryKey ?? "SelfMoments", context);
      },
    },
  );
};

// Querying for no readings
export const getMomentsUnreadCount = () =>
  request.post("/office/work_moment/unread/count", {});

// Query message list
export const useLogs = () => {
  return useInfiniteQuery<{ data: WorkMomentsResponse }>(
    ["MomentsMessageList"],
    ({ pageParam = 1 }) =>
      request.post("/office/work_moment/logs", {
        pagination: {
          pageNumber: pageParam as number,
          showNumber: 20,
        },
      }),
    {
      getNextPageParam: (lastPage, pages) => {
        if ((lastPage.data.workMoments?.length ?? 0) < 20) return null;
        return pages.length + 1;
      },
    },
  );
};

// Query message list
export enum MomentsClearType {
  Count = 1,
  List = 2,
  All = 3,
}
export const useClearUnreadMoments = () => {
  return useMutation((type: MomentsClearType) =>
    request.post("/office/work_moment/unread/clear", {
      type,
    }),
  );
};
