import { Button, DatePicker, Form, Input, Select } from "antd";
import { RangePickerProps } from "antd/es/date-picker";
import dayjs, { Dayjs } from "dayjs";
import { t } from "i18next";
import { memo } from "react";

import { useBookMeeting, useUpdateMeeting } from "@/api/meeting";
import { MeetingInfoSetting } from "@/pb/meeting.pb";
import { useUserStore } from "@/store";

import { LaunchMeetingFormFields, LaunchStep } from "./data";

type OrderOrJoinMeetingProps = {
  isLaunch?: boolean;
  meetingInfo?: MeetingInfoSetting;
  joinLoading?: boolean;
  joinMeeting?: (roomID: string) => void;
  updateStep?: (step: LaunchStep, extraData?: unknown) => void;
};
export const OrderOrJoinMeeting = memo(
  ({
    isLaunch,
    meetingInfo,
    joinLoading,
    joinMeeting,
    updateStep,
  }: OrderOrJoinMeetingProps) => {
    const [form] = Form.useForm<LaunchMeetingFormFields>();

    const { mutate: bookMeeting } = useBookMeeting();
    const { mutate: updateMeeting } = useUpdateMeeting();

    const selfInfo = useUserStore((state) => state.selfInfo);

    const onFinish = (values: LaunchMeetingFormFields) => {
      if (meetingInfo) {
        console.log("meetingInfo", meetingInfo);
        const params = {
          meetingID: meetingInfo?.info?.systemGenerated?.meetingID,
          updatingUserID: selfInfo.userID,
          title: values.meetingName,
          scheduledTime: values.startTime.unix(),
          meetingDuration: values.duration,
          password: "",
          timeZone: "Asia/Shanghai",
          repeatInfo: {
            endDate: 1735664461,
            repeatType: "None",
            uintType: "Week",
            interval: 0,
          },
          canParticipantsEnableCamera: true,
          canParticipantsUnmuteMicrophone: true,
          canParticipantsShareScreen: true,
          disableCameraOnJoin: false,
          disableMicrophoneOnJoin: false,
          canParticipantJoinMeetingEarly: true,
          lockMeeting: false,
          audioEncouragement: true,
          videoMirroring: true,
        };
        // @ts-ignore
        updateMeeting(params, {
          onSuccess: () => {
            updateStep?.(LaunchStep.Display, {
              ...meetingInfo,
              info: {
                ...meetingInfo.info,
                creatorDefinedMeeting: {
                  ...meetingInfo.info?.creatorDefinedMeeting,
                  meetingDuration: values.duration,
                  scheduledTime: values.startTime.unix(),
                  title: values.meetingName,
                },
              },
            });
          },
        });
        return;
      }

      if (isLaunch) {
        const params = {
          creatorUserID: selfInfo.userID,
          creatorDefinedMeetingInfo: {
            title: values.meetingName,
            scheduledTime: values.startTime.unix(),
            meetingDuration: values.duration,
            password: "",
            timeZone: "Asia/Shanghai",
          },
          repeatInfo: {
            endDate: 1735664461,
            repeatType: "None",
            uintType: "Week",
            interval: 0,
          },
          setting: {
            canParticipantsEnableCamera: true,
            canParticipantsUnmuteMicrophone: true,
            canParticipantsShareScreen: true,
            disableCameraOnJoin: false,
            disableMicrophoneOnJoin: false,
            canParticipantJoinMeetingEarly: true,
            lockMeeting: false,
            audioEncouragement: true,
            videoMirroring: true,
          },
        };
        // @ts-ignore
        bookMeeting(params, {
          onSuccess({ data: { detail } }) {
            updateStep?.(LaunchStep.Display, {
              ...detail,
              ...values,
              hostUserID: selfInfo.userID,
            });
          },
          onError(error) {
            console.error(error);
          },
        });
      } else {
        joinMeeting?.(values.meetingNo);
      }
    };

    const currentTime = dayjs();
    const disabledDate: RangePickerProps["disabledDate"] = (current) => {
      // Can not select days before today
      return current && current < dayjs().subtract(1, "d").endOf("day");
    };
    const disabledTime: RangePickerProps["disabledTime"] = (current) => {
      if (!current) {
        return {};
      }

      const now = dayjs();
      if (!current.isSame(now, "day")) {
        return {};
      }

      return {
        disabledHours: () => [...Array(now.hour()).keys()],
        disabledMinutes: (selectedHour) => {
          if (selectedHour === undefined) {
            return [];
          }
          // only lock minutes when the currently focused hour equals now
          if (selectedHour !== now.hour()) {
            return [];
          }
          return [...Array(now.minute()).keys()];
        },
        disabledSeconds: (selectedHour, selectedMinute) => {
          if (
            selectedHour === undefined ||
            selectedMinute === undefined ||
            selectedHour !== now.hour() ||
            selectedMinute !== now.minute()
          ) {
            return [];
          }
          return [...Array(now.second()).keys()];
        },
      };
    };

    const startTime = meetingInfo?.info?.creatorDefinedMeeting?.scheduledTime
      ? dayjs(
          (meetingInfo?.info.creatorDefinedMeeting
            ?.scheduledTime as unknown as number) * 1000,
        )
      : undefined;
    const isMeetingStarted = startTime && currentTime.isAfter(startTime);

    return (
      <div className="p-4">
        <Form
          className="meeting-form w-full"
          form={form}
          initialValues={{
            meetingName: meetingInfo?.info?.creatorDefinedMeeting?.title,
            startTime,
            duration: meetingInfo?.info?.creatorDefinedMeeting?.meetingDuration,
          }}
          layout="vertical"
          size="small"
          autoComplete="off"
          onFinish={onFinish}
        >
          {isLaunch ? (
            <>
              <Form.Item
                name="meetingName"
                label={t("placeholder.meetingName")}
                rules={[{ required: true, message: t("toast.inputMeetingName") }]}
              >
                <Input
                  disabled={isMeetingStarted}
                  maxLength={20}
                  placeholder={t("toast.inputMeetingName")}
                  spellCheck={false}
                />
              </Form.Item>
              <Form.Item
                name="startTime"
                label={t("time.startTime")}
                rules={[
                  {
                    required: true,
                    message: t("toast.selectMeetingSatrtTime"),
                  },
                  {
                    // If this validation is missing, a user select a time first, then a date, potentially
                    // choosing a past time.This validation prevents submitting a past time.
                    // After antd 5.14.0, DatePicker has a `minDate` prop that can prevent selecting past times.
                    // However, this prop is not supported in antd 5.10.0, so need validation.
                    validator: (_, value: Dayjs) => {
                      // If meeting has started, don't allow to change the start time, so don't need to validate
                      if (isMeetingStarted) return Promise.resolve();
                      if (value && value.isBefore(currentTime, "minute")) {
                        return Promise.reject(
                          new Error(t("toast.bookTimeCannotBePast")),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  disabled={isMeetingStarted}
                  disabledDate={disabledDate}
                  disabledTime={disabledTime as any}
                  showTime={{ format: "HH:mm" }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder={t("toast.selectMeetingSatrtTime")}
                />
              </Form.Item>
              <Form.Item
                name="duration"
                label={t("placeholder.meetingTime")}
                rules={[{ required: true, message: t("toast.selectMeetingTime") }]}
              >
                <Select placeholder={t("toast.selectMeetingTime")}>
                  <Select.Option value={1800}>
                    {t("date.hour", { num: 0.5 })}
                  </Select.Option>
                  <Select.Option value={3600}>
                    {t("date.hour", { num: 1 })}
                  </Select.Option>
                  <Select.Option value={5400}>
                    {t("date.hour", { num: 1.5 })}
                  </Select.Option>
                  <Select.Option value={7200}>
                    {t("date.hour", { num: 2 })}
                  </Select.Option>
                </Select>
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="meetingNo"
              label={t("placeholder.meetingID")}
              rules={[{ required: true, message: t("toast.inputmeetingID") }]}
            >
              <Input placeholder={t("toast.inputmeetingID")} />
            </Form.Item>
          )}
        </Form>

        <div className="mb-14 mt-20 w-full text-center">
          <Button
            className="ignore-drag w-[80%] rounded"
            type="primary"
            onClick={form.submit}
            loading={joinLoading}
          >
            {meetingInfo
              ? t("confirm")
              : isLaunch
              ? t("placeholder.orderMeeting")
              : t("placeholder.joinMeeting")}
          </Button>
        </div>
      </div>
    );
  },
);
