import dayjs from "dayjs";

export type LaunchMeetingFormFields = {
  meetingName: string;
  startTime: dayjs.Dayjs;
  duration: number;
  meetingNo: string;
};

export enum LaunchStep {
  Prepare,
  Order,
  Display,
  HistoryDisplay,
  Update,
  Join,
}

export const displayTypes = [LaunchStep.Display, LaunchStep.HistoryDisplay];
export const notBackTypes = [LaunchStep.Prepare, LaunchStep.Update];
