const thirdRoutes = [
  {
    path: "moments",
    async lazy() {
      const { Moments } = await import("@/pages/third/moments");
      return { Component: Moments };
    },
  },
  {
    path: "global-search",
    async lazy() {
      const { GlobalSearch } = await import("@/pages/third/globalSearch");
      return { Component: GlobalSearch };
    },
  },
  {
    path: "personal-settings",
    async lazy() {
      const { PersonalSettings } = await import("@/pages/third/personalSettings");
      return { Component: PersonalSettings };
    },
  },
  {
    path: "about",
    async lazy() {
      const { About } = await import("@/pages/third/about");
      return { Component: About };
    },
  },
  {
    path: "choose-contact",
    async lazy() {
      const { ChooseContact } = await import("@/pages/third/chooseContact");
      return { Component: ChooseContact };
    },
  },
  {
    path: "rtc-call",
    async lazy() {
      const { RtcCall } = await import("@/pages/third/rtcCall");
      return { Component: RtcCall };
    },
  },
  {
    path: "meeting",
    async lazy() {
      const { Meeting } = await import("@/pages/third/meeting");
      return { Component: Meeting };
    },
  },
  {
    path: "meeting-manage",
    async lazy() {
      const { MeetingManage } = await import("@/pages/third/meetingManage");
      return { Component: MeetingManage };
    },
  },
];

export default thirdRoutes;
