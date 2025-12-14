import { getAgentUrl } from "@/config";
import createAxiosInstance from "@/utils/request";

const request = createAxiosInstance(getAgentUrl(), false);

export const getAgentListPage = (pageNumber = 1, showNumber = 20) => {
  return request<{ total: number; agents: API.Agent.Agent[] }>({
    url: "/agent/page",
    method: "POST",
    data: {
      pagination: {
        pageNumber,
        showNumber,
      },
      userIDs: [],
    },
  });
};
