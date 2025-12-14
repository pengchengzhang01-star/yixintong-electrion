/* eslint-disable */
export const enum DayOfWeek {
  SUNDAY = "SUNDAY",
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
}

export const encodeDayOfWeek: { [key: string]: number } = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export const decodeDayOfWeek: { [key: number]: DayOfWeek } = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

export const enum KickOffReason {
  DuplicatedLogin = "DuplicatedLogin",
  Offline = "Offline",
  Logout = "Logout",
}

export const encodeKickOffReason: { [key: string]: number } = {
  DuplicatedLogin: 0,
  Offline: 1,
  Logout: 2,
};

export const decodeKickOffReason: { [key: number]: KickOffReason } = {
  0: KickOffReason.DuplicatedLogin,
  1: KickOffReason.Offline,
  2: KickOffReason.Logout,
};

export const enum MeetingEndType {
  CancelType = "CancelType",
  EndType = "EndType",
}

export const encodeMeetingEndType: { [key: string]: number } = {
  CancelType: 0,
  EndType: 1,
};

export const decodeMeetingEndType: { [key: number]: MeetingEndType } = {
  0: MeetingEndType.CancelType,
  1: MeetingEndType.EndType,
};

export interface DoubleValue {
  value?: number;
}

export function encodeDoubleValue(message: DoubleValue): Uint8Array {
  let bb = popByteBuffer();
  _encodeDoubleValue(message, bb);
  return toUint8Array(bb);
}

function _encodeDoubleValue(message: DoubleValue, bb: ByteBuffer): void {
  // optional double value = 1;
  let $value = message.value;
  if ($value !== undefined) {
    writeVarint32(bb, 9);
    writeDouble(bb, $value);
  }
}

export function decodeDoubleValue(binary: Uint8Array): DoubleValue {
  return _decodeDoubleValue(wrapByteBuffer(binary));
}

function _decodeDoubleValue(bb: ByteBuffer): DoubleValue {
  let message: DoubleValue = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional double value = 1;
      case 1: {
        message.value = readDouble(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface FloatValue {
  value?: number;
}

export function encodeFloatValue(message: FloatValue): Uint8Array {
  let bb = popByteBuffer();
  _encodeFloatValue(message, bb);
  return toUint8Array(bb);
}

function _encodeFloatValue(message: FloatValue, bb: ByteBuffer): void {
  // optional float value = 1;
  let $value = message.value;
  if ($value !== undefined) {
    writeVarint32(bb, 13);
    writeFloat(bb, $value);
  }
}

export function decodeFloatValue(binary: Uint8Array): FloatValue {
  return _decodeFloatValue(wrapByteBuffer(binary));
}

function _decodeFloatValue(bb: ByteBuffer): FloatValue {
  let message: FloatValue = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional float value = 1;
      case 1: {
        message.value = readFloat(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Int64Value {
  value?: Long;
}

export function encodeInt64Value(message: Int64Value): Uint8Array {
  let bb = popByteBuffer();
  _encodeInt64Value(message, bb);
  return toUint8Array(bb);
}

function _encodeInt64Value(message: Int64Value, bb: ByteBuffer): void {
  // optional int64 value = 1;
  let $value = message.value;
  if ($value !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, $value);
  }
}

export function decodeInt64Value(binary: Uint8Array): Int64Value {
  return _decodeInt64Value(wrapByteBuffer(binary));
}

function _decodeInt64Value(bb: ByteBuffer): Int64Value {
  let message: Int64Value = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int64 value = 1;
      case 1: {
        message.value = readVarint64(bb, /* unsigned */ false);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface UInt64Value {
  value?: Long;
}

export function encodeUInt64Value(message: UInt64Value): Uint8Array {
  let bb = popByteBuffer();
  _encodeUInt64Value(message, bb);
  return toUint8Array(bb);
}

function _encodeUInt64Value(message: UInt64Value, bb: ByteBuffer): void {
  // optional uint64 value = 1;
  let $value = message.value;
  if ($value !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, $value);
  }
}

export function decodeUInt64Value(binary: Uint8Array): UInt64Value {
  return _decodeUInt64Value(wrapByteBuffer(binary));
}

function _decodeUInt64Value(bb: ByteBuffer): UInt64Value {
  let message: UInt64Value = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional uint64 value = 1;
      case 1: {
        message.value = readVarint64(bb, /* unsigned */ true);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Int32Value {
  value?: number;
}

export function encodeInt32Value(message: Int32Value): Uint8Array {
  let bb = popByteBuffer();
  _encodeInt32Value(message, bb);
  return toUint8Array(bb);
}

function _encodeInt32Value(message: Int32Value, bb: ByteBuffer): void {
  // optional int32 value = 1;
  let $value = message.value;
  if ($value !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($value));
  }
}

export function decodeInt32Value(binary: Uint8Array): Int32Value {
  return _decodeInt32Value(wrapByteBuffer(binary));
}

function _decodeInt32Value(bb: ByteBuffer): Int32Value {
  let message: Int32Value = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 value = 1;
      case 1: {
        message.value = readVarint32(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface UInt32Value {
  value?: number;
}

export function encodeUInt32Value(message: UInt32Value): Uint8Array {
  let bb = popByteBuffer();
  _encodeUInt32Value(message, bb);
  return toUint8Array(bb);
}

function _encodeUInt32Value(message: UInt32Value, bb: ByteBuffer): void {
  // optional uint32 value = 1;
  let $value = message.value;
  if ($value !== undefined) {
    writeVarint32(bb, 8);
    writeVarint32(bb, $value);
  }
}

export function decodeUInt32Value(binary: Uint8Array): UInt32Value {
  return _decodeUInt32Value(wrapByteBuffer(binary));
}

function _decodeUInt32Value(bb: ByteBuffer): UInt32Value {
  let message: UInt32Value = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional uint32 value = 1;
      case 1: {
        message.value = readVarint32(bb) >>> 0;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface BoolValue {
  value?: boolean;
}

export function encodeBoolValue(message: BoolValue): Uint8Array {
  let bb = popByteBuffer();
  _encodeBoolValue(message, bb);
  return toUint8Array(bb);
}

function _encodeBoolValue(message: BoolValue, bb: ByteBuffer): void {
  // optional bool value = 1;
  let $value = message.value;
  if ($value !== undefined) {
    writeVarint32(bb, 8);
    writeByte(bb, $value ? 1 : 0);
  }
}

export function decodeBoolValue(binary: Uint8Array): BoolValue {
  return _decodeBoolValue(wrapByteBuffer(binary));
}

function _decodeBoolValue(bb: ByteBuffer): BoolValue {
  let message: BoolValue = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bool value = 1;
      case 1: {
        message.value = !!readByte(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface StringValue {
  value?: string;
}

export function encodeStringValue(message: StringValue): Uint8Array {
  let bb = popByteBuffer();
  _encodeStringValue(message, bb);
  return toUint8Array(bb);
}

function _encodeStringValue(message: StringValue, bb: ByteBuffer): void {
  // optional string value = 1;
  let $value = message.value;
  if ($value !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $value);
  }
}

export function decodeStringValue(binary: Uint8Array): StringValue {
  return _decodeStringValue(wrapByteBuffer(binary));
}

function _decodeStringValue(bb: ByteBuffer): StringValue {
  let message: StringValue = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string value = 1;
      case 1: {
        message.value = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface BytesValue {
  value?: Uint8Array;
}

export function encodeBytesValue(message: BytesValue): Uint8Array {
  let bb = popByteBuffer();
  _encodeBytesValue(message, bb);
  return toUint8Array(bb);
}

function _encodeBytesValue(message: BytesValue, bb: ByteBuffer): void {
  // optional bytes value = 1;
  let $value = message.value;
  if ($value !== undefined) {
    writeVarint32(bb, 10);
    writeVarint32(bb, $value.length), writeBytes(bb, $value);
  }
}

export function decodeBytesValue(binary: Uint8Array): BytesValue {
  return _decodeBytesValue(wrapByteBuffer(binary));
}

function _decodeBytesValue(bb: ByteBuffer): BytesValue {
  let message: BytesValue = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bytes value = 1;
      case 1: {
        message.value = readBytes(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface LiveKit {
  token?: string;
  url?: string;
}

export function encodeLiveKit(message: LiveKit): Uint8Array {
  let bb = popByteBuffer();
  _encodeLiveKit(message, bb);
  return toUint8Array(bb);
}

function _encodeLiveKit(message: LiveKit, bb: ByteBuffer): void {
  // optional string token = 1;
  let $token = message.token;
  if ($token !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $token);
  }

  // optional string url = 2;
  let $url = message.url;
  if ($url !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $url);
  }
}

export function decodeLiveKit(binary: Uint8Array): LiveKit {
  return _decodeLiveKit(wrapByteBuffer(binary));
}

function _decodeLiveKit(bb: ByteBuffer): LiveKit {
  let message: LiveKit = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string token = 1;
      case 1: {
        message.token = readString(bb, readVarint32(bb));
        break;
      }

      // optional string url = 2;
      case 2: {
        message.url = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface SystemGeneratedMeetingInfo {
  creatorUserID?: string;
  creatorNickname?: string;
  status?: string;
  startTime?: Long;
  meetingID?: string;
}

export function encodeSystemGeneratedMeetingInfo(
  message: SystemGeneratedMeetingInfo,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeSystemGeneratedMeetingInfo(message, bb);
  return toUint8Array(bb);
}

function _encodeSystemGeneratedMeetingInfo(
  message: SystemGeneratedMeetingInfo,
  bb: ByteBuffer,
): void {
  // optional string creatorUserID = 1;
  let $creatorUserID = message.creatorUserID;
  if ($creatorUserID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $creatorUserID);
  }

  // optional string creatorNickname = 2;
  let $creatorNickname = message.creatorNickname;
  if ($creatorNickname !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $creatorNickname);
  }

  // optional string status = 3;
  let $status = message.status;
  if ($status !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $status);
  }

  // optional int64 startTime = 4;
  let $startTime = message.startTime;
  if ($startTime !== undefined) {
    writeVarint32(bb, 32);
    writeVarint64(bb, $startTime);
  }

  // optional string meetingID = 5;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 42);
    writeString(bb, $meetingID);
  }
}

export function decodeSystemGeneratedMeetingInfo(
  binary: Uint8Array,
): SystemGeneratedMeetingInfo {
  return _decodeSystemGeneratedMeetingInfo(wrapByteBuffer(binary));
}

function _decodeSystemGeneratedMeetingInfo(bb: ByteBuffer): SystemGeneratedMeetingInfo {
  let message: SystemGeneratedMeetingInfo = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string creatorUserID = 1;
      case 1: {
        message.creatorUserID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string creatorNickname = 2;
      case 2: {
        message.creatorNickname = readString(bb, readVarint32(bb));
        break;
      }

      // optional string status = 3;
      case 3: {
        message.status = readString(bb, readVarint32(bb));
        break;
      }

      // optional int64 startTime = 4;
      case 4: {
        message.startTime = readVarint64(bb, /* unsigned */ false);
        break;
      }

      // optional string meetingID = 5;
      case 5: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface CreatorDefinedMeetingInfo {
  title?: string;
  scheduledTime?: Long;
  meetingDuration?: Long;
  password?: string;
  timeZone?: string;
  hostUserID?: string;
  coHostUSerID?: string[];
}

export function encodeCreatorDefinedMeetingInfo(
  message: CreatorDefinedMeetingInfo,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeCreatorDefinedMeetingInfo(message, bb);
  return toUint8Array(bb);
}

function _encodeCreatorDefinedMeetingInfo(
  message: CreatorDefinedMeetingInfo,
  bb: ByteBuffer,
): void {
  // optional string title = 1;
  let $title = message.title;
  if ($title !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $title);
  }

  // optional int64 scheduledTime = 2;
  let $scheduledTime = message.scheduledTime;
  if ($scheduledTime !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, $scheduledTime);
  }

  // optional int64 meetingDuration = 3;
  let $meetingDuration = message.meetingDuration;
  if ($meetingDuration !== undefined) {
    writeVarint32(bb, 24);
    writeVarint64(bb, $meetingDuration);
  }

  // optional string password = 4;
  let $password = message.password;
  if ($password !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $password);
  }

  // optional string timeZone = 5;
  let $timeZone = message.timeZone;
  if ($timeZone !== undefined) {
    writeVarint32(bb, 42);
    writeString(bb, $timeZone);
  }

  // optional string hostUserID = 6;
  let $hostUserID = message.hostUserID;
  if ($hostUserID !== undefined) {
    writeVarint32(bb, 50);
    writeString(bb, $hostUserID);
  }

  // repeated string coHostUSerID = 7;
  let array$coHostUSerID = message.coHostUSerID;
  if (array$coHostUSerID !== undefined) {
    for (let value of array$coHostUSerID) {
      writeVarint32(bb, 58);
      writeString(bb, value);
    }
  }
}

export function decodeCreatorDefinedMeetingInfo(
  binary: Uint8Array,
): CreatorDefinedMeetingInfo {
  return _decodeCreatorDefinedMeetingInfo(wrapByteBuffer(binary));
}

function _decodeCreatorDefinedMeetingInfo(bb: ByteBuffer): CreatorDefinedMeetingInfo {
  let message: CreatorDefinedMeetingInfo = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string title = 1;
      case 1: {
        message.title = readString(bb, readVarint32(bb));
        break;
      }

      // optional int64 scheduledTime = 2;
      case 2: {
        message.scheduledTime = readVarint64(bb, /* unsigned */ false);
        break;
      }

      // optional int64 meetingDuration = 3;
      case 3: {
        message.meetingDuration = readVarint64(bb, /* unsigned */ false);
        break;
      }

      // optional string password = 4;
      case 4: {
        message.password = readString(bb, readVarint32(bb));
        break;
      }

      // optional string timeZone = 5;
      case 5: {
        message.timeZone = readString(bb, readVarint32(bb));
        break;
      }

      // optional string hostUserID = 6;
      case 6: {
        message.hostUserID = readString(bb, readVarint32(bb));
        break;
      }

      // repeated string coHostUSerID = 7;
      case 7: {
        let values = message.coHostUSerID || (message.coHostUSerID = []);
        values.push(readString(bb, readVarint32(bb)));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface MeetingInfo {
  systemGenerated?: SystemGeneratedMeetingInfo;
  creatorDefinedMeeting?: CreatorDefinedMeetingInfo;
}

export function encodeMeetingInfo(message: MeetingInfo): Uint8Array {
  let bb = popByteBuffer();
  _encodeMeetingInfo(message, bb);
  return toUint8Array(bb);
}

function _encodeMeetingInfo(message: MeetingInfo, bb: ByteBuffer): void {
  // optional SystemGeneratedMeetingInfo systemGenerated = 1;
  let $systemGenerated = message.systemGenerated;
  if ($systemGenerated !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeSystemGeneratedMeetingInfo($systemGenerated, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional CreatorDefinedMeetingInfo creatorDefinedMeeting = 2;
  let $creatorDefinedMeeting = message.creatorDefinedMeeting;
  if ($creatorDefinedMeeting !== undefined) {
    writeVarint32(bb, 18);
    let nested = popByteBuffer();
    _encodeCreatorDefinedMeetingInfo($creatorDefinedMeeting, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeMeetingInfo(binary: Uint8Array): MeetingInfo {
  return _decodeMeetingInfo(wrapByteBuffer(binary));
}

function _decodeMeetingInfo(bb: ByteBuffer): MeetingInfo {
  let message: MeetingInfo = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional SystemGeneratedMeetingInfo systemGenerated = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.systemGenerated = _decodeSystemGeneratedMeetingInfo(bb);
        bb.limit = limit;
        break;
      }

      // optional CreatorDefinedMeetingInfo creatorDefinedMeeting = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        message.creatorDefinedMeeting = _decodeCreatorDefinedMeetingInfo(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface MeetingRepeatInfo {
  endDate?: Long;
  repeatTimes?: number;
  repeatType?: string;
  uintType?: string;
  interval?: number;
  repeatDaysOfWeek?: DayOfWeek[];
}

export function encodeMeetingRepeatInfo(message: MeetingRepeatInfo): Uint8Array {
  let bb = popByteBuffer();
  _encodeMeetingRepeatInfo(message, bb);
  return toUint8Array(bb);
}

function _encodeMeetingRepeatInfo(message: MeetingRepeatInfo, bb: ByteBuffer): void {
  // optional int64 endDate = 1;
  let $endDate = message.endDate;
  if ($endDate !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, $endDate);
  }

  // optional int32 repeatTimes = 2;
  let $repeatTimes = message.repeatTimes;
  if ($repeatTimes !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($repeatTimes));
  }

  // optional string repeatType = 3;
  let $repeatType = message.repeatType;
  if ($repeatType !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $repeatType);
  }

  // optional string uintType = 4;
  let $uintType = message.uintType;
  if ($uintType !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $uintType);
  }

  // optional int32 interval = 5;
  let $interval = message.interval;
  if ($interval !== undefined) {
    writeVarint32(bb, 40);
    writeVarint64(bb, intToLong($interval));
  }

  // repeated DayOfWeek repeatDaysOfWeek = 6;
  let array$repeatDaysOfWeek = message.repeatDaysOfWeek;
  if (array$repeatDaysOfWeek !== undefined) {
    let packed = popByteBuffer();
    for (let value of array$repeatDaysOfWeek) {
      writeVarint32(packed, encodeDayOfWeek[value]);
    }
    writeVarint32(bb, 50);
    writeVarint32(bb, packed.offset);
    writeByteBuffer(bb, packed);
    pushByteBuffer(packed);
  }
}

export function decodeMeetingRepeatInfo(binary: Uint8Array): MeetingRepeatInfo {
  return _decodeMeetingRepeatInfo(wrapByteBuffer(binary));
}

function _decodeMeetingRepeatInfo(bb: ByteBuffer): MeetingRepeatInfo {
  let message: MeetingRepeatInfo = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int64 endDate = 1;
      case 1: {
        message.endDate = readVarint64(bb, /* unsigned */ false);
        break;
      }

      // optional int32 repeatTimes = 2;
      case 2: {
        message.repeatTimes = readVarint32(bb);
        break;
      }

      // optional string repeatType = 3;
      case 3: {
        message.repeatType = readString(bb, readVarint32(bb));
        break;
      }

      // optional string uintType = 4;
      case 4: {
        message.uintType = readString(bb, readVarint32(bb));
        break;
      }

      // optional int32 interval = 5;
      case 5: {
        message.interval = readVarint32(bb);
        break;
      }

      // repeated DayOfWeek repeatDaysOfWeek = 6;
      case 6: {
        let values = message.repeatDaysOfWeek || (message.repeatDaysOfWeek = []);
        if ((tag & 7) === 2) {
          let outerLimit = pushTemporaryLength(bb);
          while (!isAtEnd(bb)) {
            values.push(decodeDayOfWeek[readVarint32(bb)]);
          }
          bb.limit = outerLimit;
        } else {
          values.push(decodeDayOfWeek[readVarint32(bb)]);
        }
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface MeetingSetting {
  canParticipantsEnableCamera?: boolean;
  canParticipantsUnmuteMicrophone?: boolean;
  canParticipantsShareScreen?: boolean;
  disableCameraOnJoin?: boolean;
  disableMicrophoneOnJoin?: boolean;
  canParticipantJoinMeetingEarly?: boolean;
  lockMeeting?: boolean;
  audioEncouragement?: boolean;
  videoMirroring?: boolean;
}

export function encodeMeetingSetting(message: MeetingSetting): Uint8Array {
  let bb = popByteBuffer();
  _encodeMeetingSetting(message, bb);
  return toUint8Array(bb);
}

function _encodeMeetingSetting(message: MeetingSetting, bb: ByteBuffer): void {
  // optional bool canParticipantsEnableCamera = 1;
  let $canParticipantsEnableCamera = message.canParticipantsEnableCamera;
  if ($canParticipantsEnableCamera !== undefined) {
    writeVarint32(bb, 8);
    writeByte(bb, $canParticipantsEnableCamera ? 1 : 0);
  }

  // optional bool canParticipantsUnmuteMicrophone = 2;
  let $canParticipantsUnmuteMicrophone = message.canParticipantsUnmuteMicrophone;
  if ($canParticipantsUnmuteMicrophone !== undefined) {
    writeVarint32(bb, 16);
    writeByte(bb, $canParticipantsUnmuteMicrophone ? 1 : 0);
  }

  // optional bool canParticipantsShareScreen = 3;
  let $canParticipantsShareScreen = message.canParticipantsShareScreen;
  if ($canParticipantsShareScreen !== undefined) {
    writeVarint32(bb, 24);
    writeByte(bb, $canParticipantsShareScreen ? 1 : 0);
  }

  // optional bool disableCameraOnJoin = 4;
  let $disableCameraOnJoin = message.disableCameraOnJoin;
  if ($disableCameraOnJoin !== undefined) {
    writeVarint32(bb, 32);
    writeByte(bb, $disableCameraOnJoin ? 1 : 0);
  }

  // optional bool disableMicrophoneOnJoin = 5;
  let $disableMicrophoneOnJoin = message.disableMicrophoneOnJoin;
  if ($disableMicrophoneOnJoin !== undefined) {
    writeVarint32(bb, 40);
    writeByte(bb, $disableMicrophoneOnJoin ? 1 : 0);
  }

  // optional bool canParticipantJoinMeetingEarly = 6;
  let $canParticipantJoinMeetingEarly = message.canParticipantJoinMeetingEarly;
  if ($canParticipantJoinMeetingEarly !== undefined) {
    writeVarint32(bb, 48);
    writeByte(bb, $canParticipantJoinMeetingEarly ? 1 : 0);
  }

  // optional bool lockMeeting = 7;
  let $lockMeeting = message.lockMeeting;
  if ($lockMeeting !== undefined) {
    writeVarint32(bb, 56);
    writeByte(bb, $lockMeeting ? 1 : 0);
  }

  // optional bool audioEncouragement = 8;
  let $audioEncouragement = message.audioEncouragement;
  if ($audioEncouragement !== undefined) {
    writeVarint32(bb, 64);
    writeByte(bb, $audioEncouragement ? 1 : 0);
  }

  // optional bool videoMirroring = 9;
  let $videoMirroring = message.videoMirroring;
  if ($videoMirroring !== undefined) {
    writeVarint32(bb, 72);
    writeByte(bb, $videoMirroring ? 1 : 0);
  }
}

export function decodeMeetingSetting(binary: Uint8Array): MeetingSetting {
  return _decodeMeetingSetting(wrapByteBuffer(binary));
}

function _decodeMeetingSetting(bb: ByteBuffer): MeetingSetting {
  let message: MeetingSetting = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bool canParticipantsEnableCamera = 1;
      case 1: {
        message.canParticipantsEnableCamera = !!readByte(bb);
        break;
      }

      // optional bool canParticipantsUnmuteMicrophone = 2;
      case 2: {
        message.canParticipantsUnmuteMicrophone = !!readByte(bb);
        break;
      }

      // optional bool canParticipantsShareScreen = 3;
      case 3: {
        message.canParticipantsShareScreen = !!readByte(bb);
        break;
      }

      // optional bool disableCameraOnJoin = 4;
      case 4: {
        message.disableCameraOnJoin = !!readByte(bb);
        break;
      }

      // optional bool disableMicrophoneOnJoin = 5;
      case 5: {
        message.disableMicrophoneOnJoin = !!readByte(bb);
        break;
      }

      // optional bool canParticipantJoinMeetingEarly = 6;
      case 6: {
        message.canParticipantJoinMeetingEarly = !!readByte(bb);
        break;
      }

      // optional bool lockMeeting = 7;
      case 7: {
        message.lockMeeting = !!readByte(bb);
        break;
      }

      // optional bool audioEncouragement = 8;
      case 8: {
        message.audioEncouragement = !!readByte(bb);
        break;
      }

      // optional bool videoMirroring = 9;
      case 9: {
        message.videoMirroring = !!readByte(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface MeetingInfoSetting {
  info?: MeetingInfo;
  setting?: MeetingSetting;
  repeatInfo?: MeetingRepeatInfo;
}

export function encodeMeetingInfoSetting(message: MeetingInfoSetting): Uint8Array {
  let bb = popByteBuffer();
  _encodeMeetingInfoSetting(message, bb);
  return toUint8Array(bb);
}

function _encodeMeetingInfoSetting(message: MeetingInfoSetting, bb: ByteBuffer): void {
  // optional MeetingInfo info = 1;
  let $info = message.info;
  if ($info !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeMeetingInfo($info, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional MeetingSetting setting = 2;
  let $setting = message.setting;
  if ($setting !== undefined) {
    writeVarint32(bb, 18);
    let nested = popByteBuffer();
    _encodeMeetingSetting($setting, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional MeetingRepeatInfo repeatInfo = 3;
  let $repeatInfo = message.repeatInfo;
  if ($repeatInfo !== undefined) {
    writeVarint32(bb, 26);
    let nested = popByteBuffer();
    _encodeMeetingRepeatInfo($repeatInfo, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeMeetingInfoSetting(binary: Uint8Array): MeetingInfoSetting {
  return _decodeMeetingInfoSetting(wrapByteBuffer(binary));
}

function _decodeMeetingInfoSetting(bb: ByteBuffer): MeetingInfoSetting {
  let message: MeetingInfoSetting = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional MeetingInfo info = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.info = _decodeMeetingInfo(bb);
        bb.limit = limit;
        break;
      }

      // optional MeetingSetting setting = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        message.setting = _decodeMeetingSetting(bb);
        bb.limit = limit;
        break;
      }

      // optional MeetingRepeatInfo repeatInfo = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        message.repeatInfo = _decodeMeetingRepeatInfo(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface UserInfo {
  userID?: string;
  nickname?: string;
  account?: string;
  faceURL?: string;
}

export function encodeUserInfo(message: UserInfo): Uint8Array {
  let bb = popByteBuffer();
  _encodeUserInfo(message, bb);
  return toUint8Array(bb);
}

function _encodeUserInfo(message: UserInfo, bb: ByteBuffer): void {
  // optional string userID = 1;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $userID);
  }

  // optional string nickname = 2;
  let $nickname = message.nickname;
  if ($nickname !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $nickname);
  }

  // optional string account = 3;
  let $account = message.account;
  if ($account !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $account);
  }

  // optional string faceURL = 4;
  let $faceURL = message.faceURL;
  if ($faceURL !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $faceURL);
  }
}

export function decodeUserInfo(binary: Uint8Array): UserInfo {
  return _decodeUserInfo(wrapByteBuffer(binary));
}

function _decodeUserInfo(bb: ByteBuffer): UserInfo {
  let message: UserInfo = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string userID = 1;
      case 1: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string nickname = 2;
      case 2: {
        message.nickname = readString(bb, readVarint32(bb));
        break;
      }

      // optional string account = 3;
      case 3: {
        message.account = readString(bb, readVarint32(bb));
        break;
      }

      // optional string faceURL = 4;
      case 4: {
        message.faceURL = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface ParticipantMetaData {
  userInfo?: UserInfo;
}

export function encodeParticipantMetaData(message: ParticipantMetaData): Uint8Array {
  let bb = popByteBuffer();
  _encodeParticipantMetaData(message, bb);
  return toUint8Array(bb);
}

function _encodeParticipantMetaData(
  message: ParticipantMetaData,
  bb: ByteBuffer,
): void {
  // optional UserInfo userInfo = 1;
  let $userInfo = message.userInfo;
  if ($userInfo !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeUserInfo($userInfo, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeParticipantMetaData(binary: Uint8Array): ParticipantMetaData {
  return _decodeParticipantMetaData(wrapByteBuffer(binary));
}

function _decodeParticipantMetaData(bb: ByteBuffer): ParticipantMetaData {
  let message: ParticipantMetaData = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional UserInfo userInfo = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.userInfo = _decodeUserInfo(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface BookMeetingReq {
  creatorUserID?: string;
  creatorDefinedMeetingInfo?: CreatorDefinedMeetingInfo;
  setting?: MeetingSetting;
  repeatInfo?: MeetingRepeatInfo;
}

export function encodeBookMeetingReq(message: BookMeetingReq): Uint8Array {
  let bb = popByteBuffer();
  _encodeBookMeetingReq(message, bb);
  return toUint8Array(bb);
}

function _encodeBookMeetingReq(message: BookMeetingReq, bb: ByteBuffer): void {
  // optional string creatorUserID = 1;
  let $creatorUserID = message.creatorUserID;
  if ($creatorUserID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $creatorUserID);
  }

  // optional CreatorDefinedMeetingInfo creatorDefinedMeetingInfo = 2;
  let $creatorDefinedMeetingInfo = message.creatorDefinedMeetingInfo;
  if ($creatorDefinedMeetingInfo !== undefined) {
    writeVarint32(bb, 18);
    let nested = popByteBuffer();
    _encodeCreatorDefinedMeetingInfo($creatorDefinedMeetingInfo, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional MeetingSetting setting = 3;
  let $setting = message.setting;
  if ($setting !== undefined) {
    writeVarint32(bb, 26);
    let nested = popByteBuffer();
    _encodeMeetingSetting($setting, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional MeetingRepeatInfo repeatInfo = 4;
  let $repeatInfo = message.repeatInfo;
  if ($repeatInfo !== undefined) {
    writeVarint32(bb, 34);
    let nested = popByteBuffer();
    _encodeMeetingRepeatInfo($repeatInfo, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeBookMeetingReq(binary: Uint8Array): BookMeetingReq {
  return _decodeBookMeetingReq(wrapByteBuffer(binary));
}

function _decodeBookMeetingReq(bb: ByteBuffer): BookMeetingReq {
  let message: BookMeetingReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string creatorUserID = 1;
      case 1: {
        message.creatorUserID = readString(bb, readVarint32(bb));
        break;
      }

      // optional CreatorDefinedMeetingInfo creatorDefinedMeetingInfo = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        message.creatorDefinedMeetingInfo = _decodeCreatorDefinedMeetingInfo(bb);
        bb.limit = limit;
        break;
      }

      // optional MeetingSetting setting = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        message.setting = _decodeMeetingSetting(bb);
        bb.limit = limit;
        break;
      }

      // optional MeetingRepeatInfo repeatInfo = 4;
      case 4: {
        let limit = pushTemporaryLength(bb);
        message.repeatInfo = _decodeMeetingRepeatInfo(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface BookMeetingResp {
  detail?: MeetingInfoSetting;
}

export function encodeBookMeetingResp(message: BookMeetingResp): Uint8Array {
  let bb = popByteBuffer();
  _encodeBookMeetingResp(message, bb);
  return toUint8Array(bb);
}

function _encodeBookMeetingResp(message: BookMeetingResp, bb: ByteBuffer): void {
  // optional MeetingInfoSetting detail = 1;
  let $detail = message.detail;
  if ($detail !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeMeetingInfoSetting($detail, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeBookMeetingResp(binary: Uint8Array): BookMeetingResp {
  return _decodeBookMeetingResp(wrapByteBuffer(binary));
}

function _decodeBookMeetingResp(bb: ByteBuffer): BookMeetingResp {
  let message: BookMeetingResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional MeetingInfoSetting detail = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.detail = _decodeMeetingInfoSetting(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface CreateImmediateMeetingReq {
  creatorUserID?: string;
  creatorDefinedMeetingInfo?: CreatorDefinedMeetingInfo;
  setting?: MeetingSetting;
}

export function encodeCreateImmediateMeetingReq(
  message: CreateImmediateMeetingReq,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeCreateImmediateMeetingReq(message, bb);
  return toUint8Array(bb);
}

function _encodeCreateImmediateMeetingReq(
  message: CreateImmediateMeetingReq,
  bb: ByteBuffer,
): void {
  // optional string creatorUserID = 1;
  let $creatorUserID = message.creatorUserID;
  if ($creatorUserID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $creatorUserID);
  }

  // optional CreatorDefinedMeetingInfo creatorDefinedMeetingInfo = 2;
  let $creatorDefinedMeetingInfo = message.creatorDefinedMeetingInfo;
  if ($creatorDefinedMeetingInfo !== undefined) {
    writeVarint32(bb, 18);
    let nested = popByteBuffer();
    _encodeCreatorDefinedMeetingInfo($creatorDefinedMeetingInfo, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional MeetingSetting setting = 3;
  let $setting = message.setting;
  if ($setting !== undefined) {
    writeVarint32(bb, 26);
    let nested = popByteBuffer();
    _encodeMeetingSetting($setting, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeCreateImmediateMeetingReq(
  binary: Uint8Array,
): CreateImmediateMeetingReq {
  return _decodeCreateImmediateMeetingReq(wrapByteBuffer(binary));
}

function _decodeCreateImmediateMeetingReq(bb: ByteBuffer): CreateImmediateMeetingReq {
  let message: CreateImmediateMeetingReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string creatorUserID = 1;
      case 1: {
        message.creatorUserID = readString(bb, readVarint32(bb));
        break;
      }

      // optional CreatorDefinedMeetingInfo creatorDefinedMeetingInfo = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        message.creatorDefinedMeetingInfo = _decodeCreatorDefinedMeetingInfo(bb);
        bb.limit = limit;
        break;
      }

      // optional MeetingSetting setting = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        message.setting = _decodeMeetingSetting(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface CreateImmediateMeetingResp {
  detail?: MeetingInfoSetting;
  liveKit?: LiveKit;
}

export function encodeCreateImmediateMeetingResp(
  message: CreateImmediateMeetingResp,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeCreateImmediateMeetingResp(message, bb);
  return toUint8Array(bb);
}

function _encodeCreateImmediateMeetingResp(
  message: CreateImmediateMeetingResp,
  bb: ByteBuffer,
): void {
  // optional MeetingInfoSetting detail = 1;
  let $detail = message.detail;
  if ($detail !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeMeetingInfoSetting($detail, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional LiveKit liveKit = 2;
  let $liveKit = message.liveKit;
  if ($liveKit !== undefined) {
    writeVarint32(bb, 18);
    let nested = popByteBuffer();
    _encodeLiveKit($liveKit, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeCreateImmediateMeetingResp(
  binary: Uint8Array,
): CreateImmediateMeetingResp {
  return _decodeCreateImmediateMeetingResp(wrapByteBuffer(binary));
}

function _decodeCreateImmediateMeetingResp(bb: ByteBuffer): CreateImmediateMeetingResp {
  let message: CreateImmediateMeetingResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional MeetingInfoSetting detail = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.detail = _decodeMeetingInfoSetting(bb);
        bb.limit = limit;
        break;
      }

      // optional LiveKit liveKit = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        message.liveKit = _decodeLiveKit(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface JoinMeetingReq {
  meetingID?: string;
  userID?: string;
  password?: string;
}

export function encodeJoinMeetingReq(message: JoinMeetingReq): Uint8Array {
  let bb = popByteBuffer();
  _encodeJoinMeetingReq(message, bb);
  return toUint8Array(bb);
}

function _encodeJoinMeetingReq(message: JoinMeetingReq, bb: ByteBuffer): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string userID = 2;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $userID);
  }

  // optional string password = 3;
  let $password = message.password;
  if ($password !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $password);
  }
}

export function decodeJoinMeetingReq(binary: Uint8Array): JoinMeetingReq {
  return _decodeJoinMeetingReq(wrapByteBuffer(binary));
}

function _decodeJoinMeetingReq(bb: ByteBuffer): JoinMeetingReq {
  let message: JoinMeetingReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string userID = 2;
      case 2: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string password = 3;
      case 3: {
        message.password = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface JoinMeetingResp {
  liveKit?: LiveKit;
}

export function encodeJoinMeetingResp(message: JoinMeetingResp): Uint8Array {
  let bb = popByteBuffer();
  _encodeJoinMeetingResp(message, bb);
  return toUint8Array(bb);
}

function _encodeJoinMeetingResp(message: JoinMeetingResp, bb: ByteBuffer): void {
  // optional LiveKit liveKit = 1;
  let $liveKit = message.liveKit;
  if ($liveKit !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeLiveKit($liveKit, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeJoinMeetingResp(binary: Uint8Array): JoinMeetingResp {
  return _decodeJoinMeetingResp(wrapByteBuffer(binary));
}

function _decodeJoinMeetingResp(bb: ByteBuffer): JoinMeetingResp {
  let message: JoinMeetingResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional LiveKit liveKit = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.liveKit = _decodeLiveKit(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface GetMeetingTokenReq {
  meetingID?: string;
  userID?: string;
}

export function encodeGetMeetingTokenReq(message: GetMeetingTokenReq): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetMeetingTokenReq(message, bb);
  return toUint8Array(bb);
}

function _encodeGetMeetingTokenReq(message: GetMeetingTokenReq, bb: ByteBuffer): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string userID = 2;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $userID);
  }
}

export function decodeGetMeetingTokenReq(binary: Uint8Array): GetMeetingTokenReq {
  return _decodeGetMeetingTokenReq(wrapByteBuffer(binary));
}

function _decodeGetMeetingTokenReq(bb: ByteBuffer): GetMeetingTokenReq {
  let message: GetMeetingTokenReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string userID = 2;
      case 2: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface GetMeetingTokenResp {
  meetingID?: string;
  liveKit?: LiveKit;
}

export function encodeGetMeetingTokenResp(message: GetMeetingTokenResp): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetMeetingTokenResp(message, bb);
  return toUint8Array(bb);
}

function _encodeGetMeetingTokenResp(
  message: GetMeetingTokenResp,
  bb: ByteBuffer,
): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional LiveKit liveKit = 2;
  let $liveKit = message.liveKit;
  if ($liveKit !== undefined) {
    writeVarint32(bb, 18);
    let nested = popByteBuffer();
    _encodeLiveKit($liveKit, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeGetMeetingTokenResp(binary: Uint8Array): GetMeetingTokenResp {
  return _decodeGetMeetingTokenResp(wrapByteBuffer(binary));
}

function _decodeGetMeetingTokenResp(bb: ByteBuffer): GetMeetingTokenResp {
  let message: GetMeetingTokenResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional LiveKit liveKit = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        message.liveKit = _decodeLiveKit(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface LeaveMeetingReq {
  meetingID?: string;
  userID?: string;
}

export function encodeLeaveMeetingReq(message: LeaveMeetingReq): Uint8Array {
  let bb = popByteBuffer();
  _encodeLeaveMeetingReq(message, bb);
  return toUint8Array(bb);
}

function _encodeLeaveMeetingReq(message: LeaveMeetingReq, bb: ByteBuffer): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string userID = 2;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $userID);
  }
}

export function decodeLeaveMeetingReq(binary: Uint8Array): LeaveMeetingReq {
  return _decodeLeaveMeetingReq(wrapByteBuffer(binary));
}

function _decodeLeaveMeetingReq(bb: ByteBuffer): LeaveMeetingReq {
  let message: LeaveMeetingReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string userID = 2;
      case 2: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface LeaveMeetingResp {}

export function encodeLeaveMeetingResp(message: LeaveMeetingResp): Uint8Array {
  let bb = popByteBuffer();
  _encodeLeaveMeetingResp(message, bb);
  return toUint8Array(bb);
}

function _encodeLeaveMeetingResp(message: LeaveMeetingResp, bb: ByteBuffer): void {}

export function decodeLeaveMeetingResp(binary: Uint8Array): LeaveMeetingResp {
  return _decodeLeaveMeetingResp(wrapByteBuffer(binary));
}

function _decodeLeaveMeetingResp(bb: ByteBuffer): LeaveMeetingResp {
  let message: LeaveMeetingResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface EndMeetingReq {
  meetingID?: string;
  userID?: string;
  endType?: MeetingEndType;
}

export function encodeEndMeetingReq(message: EndMeetingReq): Uint8Array {
  let bb = popByteBuffer();
  _encodeEndMeetingReq(message, bb);
  return toUint8Array(bb);
}

function _encodeEndMeetingReq(message: EndMeetingReq, bb: ByteBuffer): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string userID = 2;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $userID);
  }

  // optional MeetingEndType endType = 3;
  let $endType = message.endType;
  if ($endType !== undefined) {
    writeVarint32(bb, 24);
    writeVarint32(bb, encodeMeetingEndType[$endType]);
  }
}

export function decodeEndMeetingReq(binary: Uint8Array): EndMeetingReq {
  return _decodeEndMeetingReq(wrapByteBuffer(binary));
}

function _decodeEndMeetingReq(bb: ByteBuffer): EndMeetingReq {
  let message: EndMeetingReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string userID = 2;
      case 2: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional MeetingEndType endType = 3;
      case 3: {
        message.endType = decodeMeetingEndType[readVarint32(bb)];
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface EndMeetingResp {}

export function encodeEndMeetingResp(message: EndMeetingResp): Uint8Array {
  let bb = popByteBuffer();
  _encodeEndMeetingResp(message, bb);
  return toUint8Array(bb);
}

function _encodeEndMeetingResp(message: EndMeetingResp, bb: ByteBuffer): void {}

export function decodeEndMeetingResp(binary: Uint8Array): EndMeetingResp {
  return _decodeEndMeetingResp(wrapByteBuffer(binary));
}

function _decodeEndMeetingResp(bb: ByteBuffer): EndMeetingResp {
  let message: EndMeetingResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface GetMeetingsReq {
  userID?: string;
  status?: string[];
}

export function encodeGetMeetingsReq(message: GetMeetingsReq): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetMeetingsReq(message, bb);
  return toUint8Array(bb);
}

function _encodeGetMeetingsReq(message: GetMeetingsReq, bb: ByteBuffer): void {
  // optional string userID = 1;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $userID);
  }

  // repeated string status = 2;
  let array$status = message.status;
  if (array$status !== undefined) {
    for (let value of array$status) {
      writeVarint32(bb, 18);
      writeString(bb, value);
    }
  }
}

export function decodeGetMeetingsReq(binary: Uint8Array): GetMeetingsReq {
  return _decodeGetMeetingsReq(wrapByteBuffer(binary));
}

function _decodeGetMeetingsReq(bb: ByteBuffer): GetMeetingsReq {
  let message: GetMeetingsReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string userID = 1;
      case 1: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // repeated string status = 2;
      case 2: {
        let values = message.status || (message.status = []);
        values.push(readString(bb, readVarint32(bb)));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface GetMeetingsResp {
  meetingDetails?: MeetingInfoSetting[];
}

export function encodeGetMeetingsResp(message: GetMeetingsResp): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetMeetingsResp(message, bb);
  return toUint8Array(bb);
}

function _encodeGetMeetingsResp(message: GetMeetingsResp, bb: ByteBuffer): void {
  // repeated MeetingInfoSetting meetingDetails = 1;
  let array$meetingDetails = message.meetingDetails;
  if (array$meetingDetails !== undefined) {
    for (let value of array$meetingDetails) {
      writeVarint32(bb, 10);
      let nested = popByteBuffer();
      _encodeMeetingInfoSetting(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodeGetMeetingsResp(binary: Uint8Array): GetMeetingsResp {
  return _decodeGetMeetingsResp(wrapByteBuffer(binary));
}

function _decodeGetMeetingsResp(bb: ByteBuffer): GetMeetingsResp {
  let message: GetMeetingsResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // repeated MeetingInfoSetting meetingDetails = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        let values = message.meetingDetails || (message.meetingDetails = []);
        values.push(_decodeMeetingInfoSetting(bb));
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface GetMeetingReq {
  userID?: string;
  meetingID?: string;
}

export function encodeGetMeetingReq(message: GetMeetingReq): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetMeetingReq(message, bb);
  return toUint8Array(bb);
}

function _encodeGetMeetingReq(message: GetMeetingReq, bb: ByteBuffer): void {
  // optional string userID = 1;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $userID);
  }

  // optional string meetingID = 2;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $meetingID);
  }
}

export function decodeGetMeetingReq(binary: Uint8Array): GetMeetingReq {
  return _decodeGetMeetingReq(wrapByteBuffer(binary));
}

function _decodeGetMeetingReq(bb: ByteBuffer): GetMeetingReq {
  let message: GetMeetingReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string userID = 1;
      case 1: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string meetingID = 2;
      case 2: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface GetMeetingResp {
  meetingDetail?: MeetingInfoSetting;
}

export function encodeGetMeetingResp(message: GetMeetingResp): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetMeetingResp(message, bb);
  return toUint8Array(bb);
}

function _encodeGetMeetingResp(message: GetMeetingResp, bb: ByteBuffer): void {
  // optional MeetingInfoSetting meetingDetail = 1;
  let $meetingDetail = message.meetingDetail;
  if ($meetingDetail !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeMeetingInfoSetting($meetingDetail, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeGetMeetingResp(binary: Uint8Array): GetMeetingResp {
  return _decodeGetMeetingResp(wrapByteBuffer(binary));
}

function _decodeGetMeetingResp(bb: ByteBuffer): GetMeetingResp {
  let message: GetMeetingResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional MeetingInfoSetting meetingDetail = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.meetingDetail = _decodeMeetingInfoSetting(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface ModifyMeetingParticipantNickNameReq {
  meetingID?: string;
  userID?: string;
  participantUserID?: string;
  nickname?: string;
}

export function encodeModifyMeetingParticipantNickNameReq(
  message: ModifyMeetingParticipantNickNameReq,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeModifyMeetingParticipantNickNameReq(message, bb);
  return toUint8Array(bb);
}

function _encodeModifyMeetingParticipantNickNameReq(
  message: ModifyMeetingParticipantNickNameReq,
  bb: ByteBuffer,
): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string userID = 2;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $userID);
  }

  // optional string participantUserID = 3;
  let $participantUserID = message.participantUserID;
  if ($participantUserID !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $participantUserID);
  }

  // optional string nickname = 4;
  let $nickname = message.nickname;
  if ($nickname !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $nickname);
  }
}

export function decodeModifyMeetingParticipantNickNameReq(
  binary: Uint8Array,
): ModifyMeetingParticipantNickNameReq {
  return _decodeModifyMeetingParticipantNickNameReq(wrapByteBuffer(binary));
}

function _decodeModifyMeetingParticipantNickNameReq(
  bb: ByteBuffer,
): ModifyMeetingParticipantNickNameReq {
  let message: ModifyMeetingParticipantNickNameReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string userID = 2;
      case 2: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string participantUserID = 3;
      case 3: {
        message.participantUserID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string nickname = 4;
      case 4: {
        message.nickname = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface ModifyMeetingParticipantNickNameResp {}

export function encodeModifyMeetingParticipantNickNameResp(
  message: ModifyMeetingParticipantNickNameResp,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeModifyMeetingParticipantNickNameResp(message, bb);
  return toUint8Array(bb);
}

function _encodeModifyMeetingParticipantNickNameResp(
  message: ModifyMeetingParticipantNickNameResp,
  bb: ByteBuffer,
): void {}

export function decodeModifyMeetingParticipantNickNameResp(
  binary: Uint8Array,
): ModifyMeetingParticipantNickNameResp {
  return _decodeModifyMeetingParticipantNickNameResp(wrapByteBuffer(binary));
}

function _decodeModifyMeetingParticipantNickNameResp(
  bb: ByteBuffer,
): ModifyMeetingParticipantNickNameResp {
  let message: ModifyMeetingParticipantNickNameResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface UpdateMeetingRequest {
  meetingID?: string;
  updatingUserID?: string;
  title?: StringValue;
  scheduledTime?: Int64Value;
  meetingDuration?: Int64Value;
  password?: StringValue;
  timeZone?: StringValue;
  repeatInfo?: MeetingRepeatInfo;
  canParticipantsEnableCamera?: BoolValue;
  canParticipantsUnmuteMicrophone?: BoolValue;
  canParticipantsShareScreen?: BoolValue;
  disableCameraOnJoin?: BoolValue;
  disableMicrophoneOnJoin?: BoolValue;
  canParticipantJoinMeetingEarly?: BoolValue;
  lockMeeting?: BoolValue;
  audioEncouragement?: BoolValue;
  videoMirroring?: BoolValue;
}

export function encodeUpdateMeetingRequest(message: UpdateMeetingRequest): Uint8Array {
  let bb = popByteBuffer();
  _encodeUpdateMeetingRequest(message, bb);
  return toUint8Array(bb);
}

function _encodeUpdateMeetingRequest(
  message: UpdateMeetingRequest,
  bb: ByteBuffer,
): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string updatingUserID = 2;
  let $updatingUserID = message.updatingUserID;
  if ($updatingUserID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $updatingUserID);
  }

  // optional StringValue title = 3;
  let $title = message.title;
  if ($title !== undefined) {
    writeVarint32(bb, 26);
    let nested = popByteBuffer();
    _encodeStringValue($title, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional Int64Value scheduledTime = 4;
  let $scheduledTime = message.scheduledTime;
  if ($scheduledTime !== undefined) {
    writeVarint32(bb, 34);
    let nested = popByteBuffer();
    _encodeInt64Value($scheduledTime, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional Int64Value meetingDuration = 5;
  let $meetingDuration = message.meetingDuration;
  if ($meetingDuration !== undefined) {
    writeVarint32(bb, 42);
    let nested = popByteBuffer();
    _encodeInt64Value($meetingDuration, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional StringValue password = 6;
  let $password = message.password;
  if ($password !== undefined) {
    writeVarint32(bb, 50);
    let nested = popByteBuffer();
    _encodeStringValue($password, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional StringValue timeZone = 7;
  let $timeZone = message.timeZone;
  if ($timeZone !== undefined) {
    writeVarint32(bb, 58);
    let nested = popByteBuffer();
    _encodeStringValue($timeZone, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional MeetingRepeatInfo repeatInfo = 8;
  let $repeatInfo = message.repeatInfo;
  if ($repeatInfo !== undefined) {
    writeVarint32(bb, 66);
    let nested = popByteBuffer();
    _encodeMeetingRepeatInfo($repeatInfo, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue canParticipantsEnableCamera = 9;
  let $canParticipantsEnableCamera = message.canParticipantsEnableCamera;
  if ($canParticipantsEnableCamera !== undefined) {
    writeVarint32(bb, 74);
    let nested = popByteBuffer();
    _encodeBoolValue($canParticipantsEnableCamera, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue canParticipantsUnmuteMicrophone = 10;
  let $canParticipantsUnmuteMicrophone = message.canParticipantsUnmuteMicrophone;
  if ($canParticipantsUnmuteMicrophone !== undefined) {
    writeVarint32(bb, 82);
    let nested = popByteBuffer();
    _encodeBoolValue($canParticipantsUnmuteMicrophone, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue canParticipantsShareScreen = 11;
  let $canParticipantsShareScreen = message.canParticipantsShareScreen;
  if ($canParticipantsShareScreen !== undefined) {
    writeVarint32(bb, 90);
    let nested = popByteBuffer();
    _encodeBoolValue($canParticipantsShareScreen, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue disableCameraOnJoin = 12;
  let $disableCameraOnJoin = message.disableCameraOnJoin;
  if ($disableCameraOnJoin !== undefined) {
    writeVarint32(bb, 98);
    let nested = popByteBuffer();
    _encodeBoolValue($disableCameraOnJoin, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue disableMicrophoneOnJoin = 13;
  let $disableMicrophoneOnJoin = message.disableMicrophoneOnJoin;
  if ($disableMicrophoneOnJoin !== undefined) {
    writeVarint32(bb, 106);
    let nested = popByteBuffer();
    _encodeBoolValue($disableMicrophoneOnJoin, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue canParticipantJoinMeetingEarly = 14;
  let $canParticipantJoinMeetingEarly = message.canParticipantJoinMeetingEarly;
  if ($canParticipantJoinMeetingEarly !== undefined) {
    writeVarint32(bb, 114);
    let nested = popByteBuffer();
    _encodeBoolValue($canParticipantJoinMeetingEarly, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue lockMeeting = 15;
  let $lockMeeting = message.lockMeeting;
  if ($lockMeeting !== undefined) {
    writeVarint32(bb, 122);
    let nested = popByteBuffer();
    _encodeBoolValue($lockMeeting, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue audioEncouragement = 16;
  let $audioEncouragement = message.audioEncouragement;
  if ($audioEncouragement !== undefined) {
    writeVarint32(bb, 130);
    let nested = popByteBuffer();
    _encodeBoolValue($audioEncouragement, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue videoMirroring = 17;
  let $videoMirroring = message.videoMirroring;
  if ($videoMirroring !== undefined) {
    writeVarint32(bb, 138);
    let nested = popByteBuffer();
    _encodeBoolValue($videoMirroring, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeUpdateMeetingRequest(binary: Uint8Array): UpdateMeetingRequest {
  return _decodeUpdateMeetingRequest(wrapByteBuffer(binary));
}

function _decodeUpdateMeetingRequest(bb: ByteBuffer): UpdateMeetingRequest {
  let message: UpdateMeetingRequest = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string updatingUserID = 2;
      case 2: {
        message.updatingUserID = readString(bb, readVarint32(bb));
        break;
      }

      // optional StringValue title = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        message.title = _decodeStringValue(bb);
        bb.limit = limit;
        break;
      }

      // optional Int64Value scheduledTime = 4;
      case 4: {
        let limit = pushTemporaryLength(bb);
        message.scheduledTime = _decodeInt64Value(bb);
        bb.limit = limit;
        break;
      }

      // optional Int64Value meetingDuration = 5;
      case 5: {
        let limit = pushTemporaryLength(bb);
        message.meetingDuration = _decodeInt64Value(bb);
        bb.limit = limit;
        break;
      }

      // optional StringValue password = 6;
      case 6: {
        let limit = pushTemporaryLength(bb);
        message.password = _decodeStringValue(bb);
        bb.limit = limit;
        break;
      }

      // optional StringValue timeZone = 7;
      case 7: {
        let limit = pushTemporaryLength(bb);
        message.timeZone = _decodeStringValue(bb);
        bb.limit = limit;
        break;
      }

      // optional MeetingRepeatInfo repeatInfo = 8;
      case 8: {
        let limit = pushTemporaryLength(bb);
        message.repeatInfo = _decodeMeetingRepeatInfo(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue canParticipantsEnableCamera = 9;
      case 9: {
        let limit = pushTemporaryLength(bb);
        message.canParticipantsEnableCamera = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue canParticipantsUnmuteMicrophone = 10;
      case 10: {
        let limit = pushTemporaryLength(bb);
        message.canParticipantsUnmuteMicrophone = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue canParticipantsShareScreen = 11;
      case 11: {
        let limit = pushTemporaryLength(bb);
        message.canParticipantsShareScreen = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue disableCameraOnJoin = 12;
      case 12: {
        let limit = pushTemporaryLength(bb);
        message.disableCameraOnJoin = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue disableMicrophoneOnJoin = 13;
      case 13: {
        let limit = pushTemporaryLength(bb);
        message.disableMicrophoneOnJoin = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue canParticipantJoinMeetingEarly = 14;
      case 14: {
        let limit = pushTemporaryLength(bb);
        message.canParticipantJoinMeetingEarly = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue lockMeeting = 15;
      case 15: {
        let limit = pushTemporaryLength(bb);
        message.lockMeeting = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue audioEncouragement = 16;
      case 16: {
        let limit = pushTemporaryLength(bb);
        message.audioEncouragement = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue videoMirroring = 17;
      case 17: {
        let limit = pushTemporaryLength(bb);
        message.videoMirroring = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface UpdateMeetingResp {}

export function encodeUpdateMeetingResp(message: UpdateMeetingResp): Uint8Array {
  let bb = popByteBuffer();
  _encodeUpdateMeetingResp(message, bb);
  return toUint8Array(bb);
}

function _encodeUpdateMeetingResp(message: UpdateMeetingResp, bb: ByteBuffer): void {}

export function decodeUpdateMeetingResp(binary: Uint8Array): UpdateMeetingResp {
  return _decodeUpdateMeetingResp(wrapByteBuffer(binary));
}

function _decodeUpdateMeetingResp(bb: ByteBuffer): UpdateMeetingResp {
  let message: UpdateMeetingResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface PersonalMeetingSetting {
  cameraOnEntry?: boolean;
  microphoneOnEntry?: boolean;
}

export function encodePersonalMeetingSetting(
  message: PersonalMeetingSetting,
): Uint8Array {
  let bb = popByteBuffer();
  _encodePersonalMeetingSetting(message, bb);
  return toUint8Array(bb);
}

function _encodePersonalMeetingSetting(
  message: PersonalMeetingSetting,
  bb: ByteBuffer,
): void {
  // optional bool cameraOnEntry = 1;
  let $cameraOnEntry = message.cameraOnEntry;
  if ($cameraOnEntry !== undefined) {
    writeVarint32(bb, 8);
    writeByte(bb, $cameraOnEntry ? 1 : 0);
  }

  // optional bool microphoneOnEntry = 2;
  let $microphoneOnEntry = message.microphoneOnEntry;
  if ($microphoneOnEntry !== undefined) {
    writeVarint32(bb, 16);
    writeByte(bb, $microphoneOnEntry ? 1 : 0);
  }
}

export function decodePersonalMeetingSetting(
  binary: Uint8Array,
): PersonalMeetingSetting {
  return _decodePersonalMeetingSetting(wrapByteBuffer(binary));
}

function _decodePersonalMeetingSetting(bb: ByteBuffer): PersonalMeetingSetting {
  let message: PersonalMeetingSetting = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bool cameraOnEntry = 1;
      case 1: {
        message.cameraOnEntry = !!readByte(bb);
        break;
      }

      // optional bool microphoneOnEntry = 2;
      case 2: {
        message.microphoneOnEntry = !!readByte(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface GetPersonalMeetingSettingsReq {
  meetingID?: string;
  userID?: string;
}

export function encodeGetPersonalMeetingSettingsReq(
  message: GetPersonalMeetingSettingsReq,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetPersonalMeetingSettingsReq(message, bb);
  return toUint8Array(bb);
}

function _encodeGetPersonalMeetingSettingsReq(
  message: GetPersonalMeetingSettingsReq,
  bb: ByteBuffer,
): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string userID = 2;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $userID);
  }
}

export function decodeGetPersonalMeetingSettingsReq(
  binary: Uint8Array,
): GetPersonalMeetingSettingsReq {
  return _decodeGetPersonalMeetingSettingsReq(wrapByteBuffer(binary));
}

function _decodeGetPersonalMeetingSettingsReq(
  bb: ByteBuffer,
): GetPersonalMeetingSettingsReq {
  let message: GetPersonalMeetingSettingsReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string userID = 2;
      case 2: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface GetPersonalMeetingSettingsResp {
  setting?: PersonalMeetingSetting;
}

export function encodeGetPersonalMeetingSettingsResp(
  message: GetPersonalMeetingSettingsResp,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeGetPersonalMeetingSettingsResp(message, bb);
  return toUint8Array(bb);
}

function _encodeGetPersonalMeetingSettingsResp(
  message: GetPersonalMeetingSettingsResp,
  bb: ByteBuffer,
): void {
  // optional PersonalMeetingSetting setting = 1;
  let $setting = message.setting;
  if ($setting !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodePersonalMeetingSetting($setting, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeGetPersonalMeetingSettingsResp(
  binary: Uint8Array,
): GetPersonalMeetingSettingsResp {
  return _decodeGetPersonalMeetingSettingsResp(wrapByteBuffer(binary));
}

function _decodeGetPersonalMeetingSettingsResp(
  bb: ByteBuffer,
): GetPersonalMeetingSettingsResp {
  let message: GetPersonalMeetingSettingsResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional PersonalMeetingSetting setting = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.setting = _decodePersonalMeetingSetting(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface SetPersonalMeetingSettingsReq {
  meetingID?: string;
  userID?: string;
  cameraOnEntry?: BoolValue;
  microphoneOnEntry?: BoolValue;
}

export function encodeSetPersonalMeetingSettingsReq(
  message: SetPersonalMeetingSettingsReq,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeSetPersonalMeetingSettingsReq(message, bb);
  return toUint8Array(bb);
}

function _encodeSetPersonalMeetingSettingsReq(
  message: SetPersonalMeetingSettingsReq,
  bb: ByteBuffer,
): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string userID = 2;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $userID);
  }

  // optional BoolValue cameraOnEntry = 3;
  let $cameraOnEntry = message.cameraOnEntry;
  if ($cameraOnEntry !== undefined) {
    writeVarint32(bb, 26);
    let nested = popByteBuffer();
    _encodeBoolValue($cameraOnEntry, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue microphoneOnEntry = 4;
  let $microphoneOnEntry = message.microphoneOnEntry;
  if ($microphoneOnEntry !== undefined) {
    writeVarint32(bb, 34);
    let nested = popByteBuffer();
    _encodeBoolValue($microphoneOnEntry, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeSetPersonalMeetingSettingsReq(
  binary: Uint8Array,
): SetPersonalMeetingSettingsReq {
  return _decodeSetPersonalMeetingSettingsReq(wrapByteBuffer(binary));
}

function _decodeSetPersonalMeetingSettingsReq(
  bb: ByteBuffer,
): SetPersonalMeetingSettingsReq {
  let message: SetPersonalMeetingSettingsReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string userID = 2;
      case 2: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional BoolValue cameraOnEntry = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        message.cameraOnEntry = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue microphoneOnEntry = 4;
      case 4: {
        let limit = pushTemporaryLength(bb);
        message.microphoneOnEntry = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface SetPersonalMeetingSettingsResp {}

export function encodeSetPersonalMeetingSettingsResp(
  message: SetPersonalMeetingSettingsResp,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeSetPersonalMeetingSettingsResp(message, bb);
  return toUint8Array(bb);
}

function _encodeSetPersonalMeetingSettingsResp(
  message: SetPersonalMeetingSettingsResp,
  bb: ByteBuffer,
): void {}

export function decodeSetPersonalMeetingSettingsResp(
  binary: Uint8Array,
): SetPersonalMeetingSettingsResp {
  return _decodeSetPersonalMeetingSettingsResp(wrapByteBuffer(binary));
}

function _decodeSetPersonalMeetingSettingsResp(
  bb: ByteBuffer,
): SetPersonalMeetingSettingsResp {
  let message: SetPersonalMeetingSettingsResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface PersonalData {
  userID?: string;
  personalSetting?: PersonalMeetingSetting;
  limitSetting?: PersonalMeetingSetting;
}

export function encodePersonalData(message: PersonalData): Uint8Array {
  let bb = popByteBuffer();
  _encodePersonalData(message, bb);
  return toUint8Array(bb);
}

function _encodePersonalData(message: PersonalData, bb: ByteBuffer): void {
  // optional string userID = 1;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $userID);
  }

  // optional PersonalMeetingSetting personalSetting = 2;
  let $personalSetting = message.personalSetting;
  if ($personalSetting !== undefined) {
    writeVarint32(bb, 18);
    let nested = popByteBuffer();
    _encodePersonalMeetingSetting($personalSetting, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional PersonalMeetingSetting limitSetting = 3;
  let $limitSetting = message.limitSetting;
  if ($limitSetting !== undefined) {
    writeVarint32(bb, 26);
    let nested = popByteBuffer();
    _encodePersonalMeetingSetting($limitSetting, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodePersonalData(binary: Uint8Array): PersonalData {
  return _decodePersonalData(wrapByteBuffer(binary));
}

function _decodePersonalData(bb: ByteBuffer): PersonalData {
  let message: PersonalData = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string userID = 1;
      case 1: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional PersonalMeetingSetting personalSetting = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        message.personalSetting = _decodePersonalMeetingSetting(bb);
        bb.limit = limit;
        break;
      }

      // optional PersonalMeetingSetting limitSetting = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        message.limitSetting = _decodePersonalMeetingSetting(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface MeetingMetadata {
  detail?: MeetingInfoSetting;
  personalData?: PersonalData[];
}

export function encodeMeetingMetadata(message: MeetingMetadata): Uint8Array {
  let bb = popByteBuffer();
  _encodeMeetingMetadata(message, bb);
  return toUint8Array(bb);
}

function _encodeMeetingMetadata(message: MeetingMetadata, bb: ByteBuffer): void {
  // optional MeetingInfoSetting detail = 1;
  let $detail = message.detail;
  if ($detail !== undefined) {
    writeVarint32(bb, 10);
    let nested = popByteBuffer();
    _encodeMeetingInfoSetting($detail, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // repeated PersonalData personalData = 2;
  let array$personalData = message.personalData;
  if (array$personalData !== undefined) {
    for (let value of array$personalData) {
      writeVarint32(bb, 18);
      let nested = popByteBuffer();
      _encodePersonalData(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodeMeetingMetadata(binary: Uint8Array): MeetingMetadata {
  return _decodeMeetingMetadata(wrapByteBuffer(binary));
}

function _decodeMeetingMetadata(bb: ByteBuffer): MeetingMetadata {
  let message: MeetingMetadata = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional MeetingInfoSetting detail = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        message.detail = _decodeMeetingInfoSetting(bb);
        bb.limit = limit;
        break;
      }

      // repeated PersonalData personalData = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        let values = message.personalData || (message.personalData = []);
        values.push(_decodePersonalData(bb));
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface OperateRoomAllStreamReq {
  meetingID?: string;
  operatorUserID?: string;
  cameraOnEntry?: BoolValue;
  microphoneOnEntry?: BoolValue;
}

export function encodeOperateRoomAllStreamReq(
  message: OperateRoomAllStreamReq,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeOperateRoomAllStreamReq(message, bb);
  return toUint8Array(bb);
}

function _encodeOperateRoomAllStreamReq(
  message: OperateRoomAllStreamReq,
  bb: ByteBuffer,
): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string operatorUserID = 2;
  let $operatorUserID = message.operatorUserID;
  if ($operatorUserID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $operatorUserID);
  }

  // optional BoolValue cameraOnEntry = 3;
  let $cameraOnEntry = message.cameraOnEntry;
  if ($cameraOnEntry !== undefined) {
    writeVarint32(bb, 26);
    let nested = popByteBuffer();
    _encodeBoolValue($cameraOnEntry, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue microphoneOnEntry = 4;
  let $microphoneOnEntry = message.microphoneOnEntry;
  if ($microphoneOnEntry !== undefined) {
    writeVarint32(bb, 34);
    let nested = popByteBuffer();
    _encodeBoolValue($microphoneOnEntry, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeOperateRoomAllStreamReq(
  binary: Uint8Array,
): OperateRoomAllStreamReq {
  return _decodeOperateRoomAllStreamReq(wrapByteBuffer(binary));
}

function _decodeOperateRoomAllStreamReq(bb: ByteBuffer): OperateRoomAllStreamReq {
  let message: OperateRoomAllStreamReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string operatorUserID = 2;
      case 2: {
        message.operatorUserID = readString(bb, readVarint32(bb));
        break;
      }

      // optional BoolValue cameraOnEntry = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        message.cameraOnEntry = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue microphoneOnEntry = 4;
      case 4: {
        let limit = pushTemporaryLength(bb);
        message.microphoneOnEntry = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface OperateRoomAllStreamResp {
  streamNotExistUserIDList?: string[];
  failedUserIDList?: string[];
}

export function encodeOperateRoomAllStreamResp(
  message: OperateRoomAllStreamResp,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeOperateRoomAllStreamResp(message, bb);
  return toUint8Array(bb);
}

function _encodeOperateRoomAllStreamResp(
  message: OperateRoomAllStreamResp,
  bb: ByteBuffer,
): void {
  // repeated string streamNotExistUserIDList = 1;
  let array$streamNotExistUserIDList = message.streamNotExistUserIDList;
  if (array$streamNotExistUserIDList !== undefined) {
    for (let value of array$streamNotExistUserIDList) {
      writeVarint32(bb, 10);
      writeString(bb, value);
    }
  }

  // repeated string failedUserIDList = 2;
  let array$failedUserIDList = message.failedUserIDList;
  if (array$failedUserIDList !== undefined) {
    for (let value of array$failedUserIDList) {
      writeVarint32(bb, 18);
      writeString(bb, value);
    }
  }
}

export function decodeOperateRoomAllStreamResp(
  binary: Uint8Array,
): OperateRoomAllStreamResp {
  return _decodeOperateRoomAllStreamResp(wrapByteBuffer(binary));
}

function _decodeOperateRoomAllStreamResp(bb: ByteBuffer): OperateRoomAllStreamResp {
  let message: OperateRoomAllStreamResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // repeated string streamNotExistUserIDList = 1;
      case 1: {
        let values =
          message.streamNotExistUserIDList || (message.streamNotExistUserIDList = []);
        values.push(readString(bb, readVarint32(bb)));
        break;
      }

      // repeated string failedUserIDList = 2;
      case 2: {
        let values = message.failedUserIDList || (message.failedUserIDList = []);
        values.push(readString(bb, readVarint32(bb)));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface RemoveMeetingParticipantsReq {
  meetingID?: string;
  userID?: string;
  participantUserIDs?: string[];
}

export function encodeRemoveMeetingParticipantsReq(
  message: RemoveMeetingParticipantsReq,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeRemoveMeetingParticipantsReq(message, bb);
  return toUint8Array(bb);
}

function _encodeRemoveMeetingParticipantsReq(
  message: RemoveMeetingParticipantsReq,
  bb: ByteBuffer,
): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string userID = 2;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $userID);
  }

  // repeated string participantUserIDs = 3;
  let array$participantUserIDs = message.participantUserIDs;
  if (array$participantUserIDs !== undefined) {
    for (let value of array$participantUserIDs) {
      writeVarint32(bb, 26);
      writeString(bb, value);
    }
  }
}

export function decodeRemoveMeetingParticipantsReq(
  binary: Uint8Array,
): RemoveMeetingParticipantsReq {
  return _decodeRemoveMeetingParticipantsReq(wrapByteBuffer(binary));
}

function _decodeRemoveMeetingParticipantsReq(
  bb: ByteBuffer,
): RemoveMeetingParticipantsReq {
  let message: RemoveMeetingParticipantsReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string userID = 2;
      case 2: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // repeated string participantUserIDs = 3;
      case 3: {
        let values = message.participantUserIDs || (message.participantUserIDs = []);
        values.push(readString(bb, readVarint32(bb)));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface RemoveMeetingParticipantsResp {
  successUserIDList?: string[];
  failedUserIDList?: string[];
}

export function encodeRemoveMeetingParticipantsResp(
  message: RemoveMeetingParticipantsResp,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeRemoveMeetingParticipantsResp(message, bb);
  return toUint8Array(bb);
}

function _encodeRemoveMeetingParticipantsResp(
  message: RemoveMeetingParticipantsResp,
  bb: ByteBuffer,
): void {
  // repeated string successUserIDList = 1;
  let array$successUserIDList = message.successUserIDList;
  if (array$successUserIDList !== undefined) {
    for (let value of array$successUserIDList) {
      writeVarint32(bb, 10);
      writeString(bb, value);
    }
  }

  // repeated string failedUserIDList = 2;
  let array$failedUserIDList = message.failedUserIDList;
  if (array$failedUserIDList !== undefined) {
    for (let value of array$failedUserIDList) {
      writeVarint32(bb, 18);
      writeString(bb, value);
    }
  }
}

export function decodeRemoveMeetingParticipantsResp(
  binary: Uint8Array,
): RemoveMeetingParticipantsResp {
  return _decodeRemoveMeetingParticipantsResp(wrapByteBuffer(binary));
}

function _decodeRemoveMeetingParticipantsResp(
  bb: ByteBuffer,
): RemoveMeetingParticipantsResp {
  let message: RemoveMeetingParticipantsResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // repeated string successUserIDList = 1;
      case 1: {
        let values = message.successUserIDList || (message.successUserIDList = []);
        values.push(readString(bb, readVarint32(bb)));
        break;
      }

      // repeated string failedUserIDList = 2;
      case 2: {
        let values = message.failedUserIDList || (message.failedUserIDList = []);
        values.push(readString(bb, readVarint32(bb)));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface SetMeetingHostInfoReq {
  meetingID?: string;
  userID?: string;
  hostUserID?: StringValue;
  coHostUserIDs?: string[];
}

export function encodeSetMeetingHostInfoReq(
  message: SetMeetingHostInfoReq,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeSetMeetingHostInfoReq(message, bb);
  return toUint8Array(bb);
}

function _encodeSetMeetingHostInfoReq(
  message: SetMeetingHostInfoReq,
  bb: ByteBuffer,
): void {
  // optional string meetingID = 1;
  let $meetingID = message.meetingID;
  if ($meetingID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $meetingID);
  }

  // optional string userID = 2;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $userID);
  }

  // optional StringValue hostUserID = 3;
  let $hostUserID = message.hostUserID;
  if ($hostUserID !== undefined) {
    writeVarint32(bb, 26);
    let nested = popByteBuffer();
    _encodeStringValue($hostUserID, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // repeated string coHostUserIDs = 4;
  let array$coHostUserIDs = message.coHostUserIDs;
  if (array$coHostUserIDs !== undefined) {
    for (let value of array$coHostUserIDs) {
      writeVarint32(bb, 34);
      writeString(bb, value);
    }
  }
}

export function decodeSetMeetingHostInfoReq(binary: Uint8Array): SetMeetingHostInfoReq {
  return _decodeSetMeetingHostInfoReq(wrapByteBuffer(binary));
}

function _decodeSetMeetingHostInfoReq(bb: ByteBuffer): SetMeetingHostInfoReq {
  let message: SetMeetingHostInfoReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string meetingID = 1;
      case 1: {
        message.meetingID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string userID = 2;
      case 2: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional StringValue hostUserID = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        message.hostUserID = _decodeStringValue(bb);
        bb.limit = limit;
        break;
      }

      // repeated string coHostUserIDs = 4;
      case 4: {
        let values = message.coHostUserIDs || (message.coHostUserIDs = []);
        values.push(readString(bb, readVarint32(bb)));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface SetMeetingHostInfoResp {}

export function encodeSetMeetingHostInfoResp(
  message: SetMeetingHostInfoResp,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeSetMeetingHostInfoResp(message, bb);
  return toUint8Array(bb);
}

function _encodeSetMeetingHostInfoResp(
  message: SetMeetingHostInfoResp,
  bb: ByteBuffer,
): void {}

export function decodeSetMeetingHostInfoResp(
  binary: Uint8Array,
): SetMeetingHostInfoResp {
  return _decodeSetMeetingHostInfoResp(wrapByteBuffer(binary));
}

function _decodeSetMeetingHostInfoResp(bb: ByteBuffer): SetMeetingHostInfoResp {
  let message: SetMeetingHostInfoResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface NotifyMeetingData {
  operatorUserID?: string;
  streamOperateData?: StreamOperateData;
  meetingHostData?: MeetingHostData;
  kickOffMeetingData?: KickOffMeetingData;
}

export function encodeNotifyMeetingData(message: NotifyMeetingData): Uint8Array {
  let bb = popByteBuffer();
  _encodeNotifyMeetingData(message, bb);
  return toUint8Array(bb);
}

function _encodeNotifyMeetingData(message: NotifyMeetingData, bb: ByteBuffer): void {
  // optional string operatorUserID = 1;
  let $operatorUserID = message.operatorUserID;
  if ($operatorUserID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $operatorUserID);
  }

  // optional StreamOperateData streamOperateData = 2;
  let $streamOperateData = message.streamOperateData;
  if ($streamOperateData !== undefined) {
    writeVarint32(bb, 18);
    let nested = popByteBuffer();
    _encodeStreamOperateData($streamOperateData, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional MeetingHostData meetingHostData = 3;
  let $meetingHostData = message.meetingHostData;
  if ($meetingHostData !== undefined) {
    writeVarint32(bb, 26);
    let nested = popByteBuffer();
    _encodeMeetingHostData($meetingHostData, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional KickOffMeetingData kickOffMeetingData = 4;
  let $kickOffMeetingData = message.kickOffMeetingData;
  if ($kickOffMeetingData !== undefined) {
    writeVarint32(bb, 34);
    let nested = popByteBuffer();
    _encodeKickOffMeetingData($kickOffMeetingData, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeNotifyMeetingData(binary: Uint8Array): NotifyMeetingData {
  return _decodeNotifyMeetingData(wrapByteBuffer(binary));
}

function _decodeNotifyMeetingData(bb: ByteBuffer): NotifyMeetingData {
  let message: NotifyMeetingData = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string operatorUserID = 1;
      case 1: {
        message.operatorUserID = readString(bb, readVarint32(bb));
        break;
      }

      // optional StreamOperateData streamOperateData = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        message.streamOperateData = _decodeStreamOperateData(bb);
        bb.limit = limit;
        break;
      }

      // optional MeetingHostData meetingHostData = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        message.meetingHostData = _decodeMeetingHostData(bb);
        bb.limit = limit;
        break;
      }

      // optional KickOffMeetingData kickOffMeetingData = 4;
      case 4: {
        let limit = pushTemporaryLength(bb);
        message.kickOffMeetingData = _decodeKickOffMeetingData(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface KickOffMeetingData {
  userID?: string;
  nickname?: string;
  reasonCode?: KickOffReason;
  reason?: string;
}

export function encodeKickOffMeetingData(message: KickOffMeetingData): Uint8Array {
  let bb = popByteBuffer();
  _encodeKickOffMeetingData(message, bb);
  return toUint8Array(bb);
}

function _encodeKickOffMeetingData(message: KickOffMeetingData, bb: ByteBuffer): void {
  // optional string userID = 1;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $userID);
  }

  // optional string nickname = 2;
  let $nickname = message.nickname;
  if ($nickname !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $nickname);
  }

  // optional KickOffReason reasonCode = 3;
  let $reasonCode = message.reasonCode;
  if ($reasonCode !== undefined) {
    writeVarint32(bb, 24);
    writeVarint32(bb, encodeKickOffReason[$reasonCode]);
  }

  // optional string reason = 4;
  let $reason = message.reason;
  if ($reason !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $reason);
  }
}

export function decodeKickOffMeetingData(binary: Uint8Array): KickOffMeetingData {
  return _decodeKickOffMeetingData(wrapByteBuffer(binary));
}

function _decodeKickOffMeetingData(bb: ByteBuffer): KickOffMeetingData {
  let message: KickOffMeetingData = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string userID = 1;
      case 1: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string nickname = 2;
      case 2: {
        message.nickname = readString(bb, readVarint32(bb));
        break;
      }

      // optional KickOffReason reasonCode = 3;
      case 3: {
        message.reasonCode = decodeKickOffReason[readVarint32(bb)];
        break;
      }

      // optional string reason = 4;
      case 4: {
        message.reason = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface StreamOperateData {
  operation?: UserOperationData[];
}

export function encodeStreamOperateData(message: StreamOperateData): Uint8Array {
  let bb = popByteBuffer();
  _encodeStreamOperateData(message, bb);
  return toUint8Array(bb);
}

function _encodeStreamOperateData(message: StreamOperateData, bb: ByteBuffer): void {
  // repeated UserOperationData operation = 1;
  let array$operation = message.operation;
  if (array$operation !== undefined) {
    for (let value of array$operation) {
      writeVarint32(bb, 10);
      let nested = popByteBuffer();
      _encodeUserOperationData(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodeStreamOperateData(binary: Uint8Array): StreamOperateData {
  return _decodeStreamOperateData(wrapByteBuffer(binary));
}

function _decodeStreamOperateData(bb: ByteBuffer): StreamOperateData {
  let message: StreamOperateData = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // repeated UserOperationData operation = 1;
      case 1: {
        let limit = pushTemporaryLength(bb);
        let values = message.operation || (message.operation = []);
        values.push(_decodeUserOperationData(bb));
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface UserOperationData {
  userID?: string;
  cameraOnEntry?: BoolValue;
  microphoneOnEntry?: BoolValue;
}

export function encodeUserOperationData(message: UserOperationData): Uint8Array {
  let bb = popByteBuffer();
  _encodeUserOperationData(message, bb);
  return toUint8Array(bb);
}

function _encodeUserOperationData(message: UserOperationData, bb: ByteBuffer): void {
  // optional string userID = 1;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $userID);
  }

  // optional BoolValue cameraOnEntry = 2;
  let $cameraOnEntry = message.cameraOnEntry;
  if ($cameraOnEntry !== undefined) {
    writeVarint32(bb, 18);
    let nested = popByteBuffer();
    _encodeBoolValue($cameraOnEntry, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BoolValue microphoneOnEntry = 3;
  let $microphoneOnEntry = message.microphoneOnEntry;
  if ($microphoneOnEntry !== undefined) {
    writeVarint32(bb, 26);
    let nested = popByteBuffer();
    _encodeBoolValue($microphoneOnEntry, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeUserOperationData(binary: Uint8Array): UserOperationData {
  return _decodeUserOperationData(wrapByteBuffer(binary));
}

function _decodeUserOperationData(bb: ByteBuffer): UserOperationData {
  let message: UserOperationData = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string userID = 1;
      case 1: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional BoolValue cameraOnEntry = 2;
      case 2: {
        let limit = pushTemporaryLength(bb);
        message.cameraOnEntry = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      // optional BoolValue microphoneOnEntry = 3;
      case 3: {
        let limit = pushTemporaryLength(bb);
        message.microphoneOnEntry = _decodeBoolValue(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface MeetingHostData {
  operatorNickname?: string;
  userID?: string;
  hostType?: string;
}

export function encodeMeetingHostData(message: MeetingHostData): Uint8Array {
  let bb = popByteBuffer();
  _encodeMeetingHostData(message, bb);
  return toUint8Array(bb);
}

function _encodeMeetingHostData(message: MeetingHostData, bb: ByteBuffer): void {
  // optional string operatorNickname = 2;
  let $operatorNickname = message.operatorNickname;
  if ($operatorNickname !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $operatorNickname);
  }

  // optional string userID = 3;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $userID);
  }

  // optional string hostType = 4;
  let $hostType = message.hostType;
  if ($hostType !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $hostType);
  }
}

export function decodeMeetingHostData(binary: Uint8Array): MeetingHostData {
  return _decodeMeetingHostData(wrapByteBuffer(binary));
}

function _decodeMeetingHostData(bb: ByteBuffer): MeetingHostData {
  let message: MeetingHostData = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string operatorNickname = 2;
      case 2: {
        message.operatorNickname = readString(bb, readVarint32(bb));
        break;
      }

      // optional string userID = 3;
      case 3: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional string hostType = 4;
      case 4: {
        message.hostType = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface CleanPreviousMeetingsReq {
  userID?: string;
  reasonCode?: number;
  reason?: string;
}

export function encodeCleanPreviousMeetingsReq(
  message: CleanPreviousMeetingsReq,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeCleanPreviousMeetingsReq(message, bb);
  return toUint8Array(bb);
}

function _encodeCleanPreviousMeetingsReq(
  message: CleanPreviousMeetingsReq,
  bb: ByteBuffer,
): void {
  // optional string userID = 1;
  let $userID = message.userID;
  if ($userID !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $userID);
  }

  // optional int32 reasonCode = 2;
  let $reasonCode = message.reasonCode;
  if ($reasonCode !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($reasonCode));
  }

  // optional string reason = 3;
  let $reason = message.reason;
  if ($reason !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $reason);
  }
}

export function decodeCleanPreviousMeetingsReq(
  binary: Uint8Array,
): CleanPreviousMeetingsReq {
  return _decodeCleanPreviousMeetingsReq(wrapByteBuffer(binary));
}

function _decodeCleanPreviousMeetingsReq(bb: ByteBuffer): CleanPreviousMeetingsReq {
  let message: CleanPreviousMeetingsReq = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string userID = 1;
      case 1: {
        message.userID = readString(bb, readVarint32(bb));
        break;
      }

      // optional int32 reasonCode = 2;
      case 2: {
        message.reasonCode = readVarint32(bb);
        break;
      }

      // optional string reason = 3;
      case 3: {
        message.reason = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface CleanPreviousMeetingsResp {}

export function encodeCleanPreviousMeetingsResp(
  message: CleanPreviousMeetingsResp,
): Uint8Array {
  let bb = popByteBuffer();
  _encodeCleanPreviousMeetingsResp(message, bb);
  return toUint8Array(bb);
}

function _encodeCleanPreviousMeetingsResp(
  message: CleanPreviousMeetingsResp,
  bb: ByteBuffer,
): void {}

export function decodeCleanPreviousMeetingsResp(
  binary: Uint8Array,
): CleanPreviousMeetingsResp {
  return _decodeCleanPreviousMeetingsResp(wrapByteBuffer(binary));
}

function _decodeCleanPreviousMeetingsResp(bb: ByteBuffer): CleanPreviousMeetingsResp {
  let message: CleanPreviousMeetingsResp = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Long {
  low: number;
  high: number;
  unsigned: boolean;
}

interface ByteBuffer {
  bytes: Uint8Array;
  offset: number;
  limit: number;
}

function pushTemporaryLength(bb: ByteBuffer): number {
  let length = readVarint32(bb);
  let limit = bb.limit;
  bb.limit = bb.offset + length;
  return limit;
}

function skipUnknownField(bb: ByteBuffer, type: number): void {
  switch (type) {
    case 0:
      while (readByte(bb) & 0x80) {}
      break;
    case 2:
      skip(bb, readVarint32(bb));
      break;
    case 5:
      skip(bb, 4);
      break;
    case 1:
      skip(bb, 8);
      break;
    default:
      throw new Error("Unimplemented type: " + type);
  }
}

function stringToLong(value: string): Long {
  return {
    low: value.charCodeAt(0) | (value.charCodeAt(1) << 16),
    high: value.charCodeAt(2) | (value.charCodeAt(3) << 16),
    unsigned: false,
  };
}

function longToString(value: Long): string {
  let low = value.low;
  let high = value.high;
  return String.fromCharCode(low & 0xffff, low >>> 16, high & 0xffff, high >>> 16);
}

// The code below was modified from https://github.com/protobufjs/bytebuffer.js
// which is under the Apache License 2.0.

let f32 = new Float32Array(1);
let f32_u8 = new Uint8Array(f32.buffer);

let f64 = new Float64Array(1);
let f64_u8 = new Uint8Array(f64.buffer);

function intToLong(value: number): Long {
  value |= 0;
  return {
    low: value,
    high: value >> 31,
    unsigned: value >= 0,
  };
}

let bbStack: ByteBuffer[] = [];

function popByteBuffer(): ByteBuffer {
  const bb = bbStack.pop();
  if (!bb) return { bytes: new Uint8Array(64), offset: 0, limit: 0 };
  bb.offset = bb.limit = 0;
  return bb;
}

function pushByteBuffer(bb: ByteBuffer): void {
  bbStack.push(bb);
}

function wrapByteBuffer(bytes: Uint8Array): ByteBuffer {
  return { bytes, offset: 0, limit: bytes.length };
}

function toUint8Array(bb: ByteBuffer): Uint8Array {
  let bytes = bb.bytes;
  let limit = bb.limit;
  return bytes.length === limit ? bytes : bytes.subarray(0, limit);
}

function skip(bb: ByteBuffer, offset: number): void {
  if (bb.offset + offset > bb.limit) {
    throw new Error("Skip past limit");
  }
  bb.offset += offset;
}

function isAtEnd(bb: ByteBuffer): boolean {
  return bb.offset >= bb.limit;
}

function grow(bb: ByteBuffer, count: number): number {
  let bytes = bb.bytes;
  let offset = bb.offset;
  let limit = bb.limit;
  let finalOffset = offset + count;
  if (finalOffset > bytes.length) {
    let newBytes = new Uint8Array(finalOffset * 2);
    newBytes.set(bytes);
    bb.bytes = newBytes;
  }
  bb.offset = finalOffset;
  if (finalOffset > limit) {
    bb.limit = finalOffset;
  }
  return offset;
}

function advance(bb: ByteBuffer, count: number): number {
  let offset = bb.offset;
  if (offset + count > bb.limit) {
    throw new Error("Read past limit");
  }
  bb.offset += count;
  return offset;
}

function readBytes(bb: ByteBuffer, count: number): Uint8Array {
  let offset = advance(bb, count);
  return bb.bytes.subarray(offset, offset + count);
}

function writeBytes(bb: ByteBuffer, buffer: Uint8Array): void {
  let offset = grow(bb, buffer.length);
  bb.bytes.set(buffer, offset);
}

function readString(bb: ByteBuffer, count: number): string {
  // Sadly a hand-coded UTF8 decoder is much faster than subarray+TextDecoder in V8
  let offset = advance(bb, count);
  let fromCharCode = String.fromCharCode;
  let bytes = bb.bytes;
  let invalid = "\uFFFD";
  let text = "";

  for (let i = 0; i < count; i++) {
    let c1 = bytes[i + offset],
      c2: number,
      c3: number,
      c4: number,
      c: number;

    // 1 byte
    if ((c1 & 0x80) === 0) {
      text += fromCharCode(c1);
    }

    // 2 bytes
    else if ((c1 & 0xe0) === 0xc0) {
      if (i + 1 >= count) text += invalid;
      else {
        c2 = bytes[i + offset + 1];
        if ((c2 & 0xc0) !== 0x80) text += invalid;
        else {
          c = ((c1 & 0x1f) << 6) | (c2 & 0x3f);
          if (c < 0x80) text += invalid;
          else {
            text += fromCharCode(c);
            i++;
          }
        }
      }
    }

    // 3 bytes
    else if ((c1 & 0xf0) == 0xe0) {
      if (i + 2 >= count) text += invalid;
      else {
        c2 = bytes[i + offset + 1];
        c3 = bytes[i + offset + 2];
        if (((c2 | (c3 << 8)) & 0xc0c0) !== 0x8080) text += invalid;
        else {
          c = ((c1 & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f);
          if (c < 0x0800 || (c >= 0xd800 && c <= 0xdfff)) text += invalid;
          else {
            text += fromCharCode(c);
            i += 2;
          }
        }
      }
    }

    // 4 bytes
    else if ((c1 & 0xf8) == 0xf0) {
      if (i + 3 >= count) text += invalid;
      else {
        c2 = bytes[i + offset + 1];
        c3 = bytes[i + offset + 2];
        c4 = bytes[i + offset + 3];
        if (((c2 | (c3 << 8) | (c4 << 16)) & 0xc0c0c0) !== 0x808080) text += invalid;
        else {
          c =
            ((c1 & 0x07) << 0x12) |
            ((c2 & 0x3f) << 0x0c) |
            ((c3 & 0x3f) << 0x06) |
            (c4 & 0x3f);
          if (c < 0x10000 || c > 0x10ffff) text += invalid;
          else {
            c -= 0x10000;
            text += fromCharCode((c >> 10) + 0xd800, (c & 0x3ff) + 0xdc00);
            i += 3;
          }
        }
      }
    } else text += invalid;
  }

  return text;
}

function writeString(bb: ByteBuffer, text: string): void {
  // Sadly a hand-coded UTF8 encoder is much faster than TextEncoder+set in V8
  let n = text.length;
  let byteCount = 0;

  // Write the byte count first
  for (let i = 0; i < n; i++) {
    let c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < n) {
      c = (c << 10) + text.charCodeAt(++i) - 0x35fdc00;
    }
    byteCount += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }
  writeVarint32(bb, byteCount);

  let offset = grow(bb, byteCount);
  let bytes = bb.bytes;

  // Then write the bytes
  for (let i = 0; i < n; i++) {
    let c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < n) {
      c = (c << 10) + text.charCodeAt(++i) - 0x35fdc00;
    }
    if (c < 0x80) {
      bytes[offset++] = c;
    } else {
      if (c < 0x800) {
        bytes[offset++] = ((c >> 6) & 0x1f) | 0xc0;
      } else {
        if (c < 0x10000) {
          bytes[offset++] = ((c >> 12) & 0x0f) | 0xe0;
        } else {
          bytes[offset++] = ((c >> 18) & 0x07) | 0xf0;
          bytes[offset++] = ((c >> 12) & 0x3f) | 0x80;
        }
        bytes[offset++] = ((c >> 6) & 0x3f) | 0x80;
      }
      bytes[offset++] = (c & 0x3f) | 0x80;
    }
  }
}

function writeByteBuffer(bb: ByteBuffer, buffer: ByteBuffer): void {
  let offset = grow(bb, buffer.limit);
  let from = bb.bytes;
  let to = buffer.bytes;

  // This for loop is much faster than subarray+set on V8
  for (let i = 0, n = buffer.limit; i < n; i++) {
    from[i + offset] = to[i];
  }
}

function readByte(bb: ByteBuffer): number {
  return bb.bytes[advance(bb, 1)];
}

function writeByte(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 1);
  bb.bytes[offset] = value;
}

function readFloat(bb: ByteBuffer): number {
  let offset = advance(bb, 4);
  let bytes = bb.bytes;

  // Manual copying is much faster than subarray+set in V8
  f32_u8[0] = bytes[offset++];
  f32_u8[1] = bytes[offset++];
  f32_u8[2] = bytes[offset++];
  f32_u8[3] = bytes[offset++];
  return f32[0];
}

function writeFloat(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 4);
  let bytes = bb.bytes;
  f32[0] = value;

  // Manual copying is much faster than subarray+set in V8
  bytes[offset++] = f32_u8[0];
  bytes[offset++] = f32_u8[1];
  bytes[offset++] = f32_u8[2];
  bytes[offset++] = f32_u8[3];
}

function readDouble(bb: ByteBuffer): number {
  let offset = advance(bb, 8);
  let bytes = bb.bytes;

  // Manual copying is much faster than subarray+set in V8
  f64_u8[0] = bytes[offset++];
  f64_u8[1] = bytes[offset++];
  f64_u8[2] = bytes[offset++];
  f64_u8[3] = bytes[offset++];
  f64_u8[4] = bytes[offset++];
  f64_u8[5] = bytes[offset++];
  f64_u8[6] = bytes[offset++];
  f64_u8[7] = bytes[offset++];
  return f64[0];
}

function writeDouble(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 8);
  let bytes = bb.bytes;
  f64[0] = value;

  // Manual copying is much faster than subarray+set in V8
  bytes[offset++] = f64_u8[0];
  bytes[offset++] = f64_u8[1];
  bytes[offset++] = f64_u8[2];
  bytes[offset++] = f64_u8[3];
  bytes[offset++] = f64_u8[4];
  bytes[offset++] = f64_u8[5];
  bytes[offset++] = f64_u8[6];
  bytes[offset++] = f64_u8[7];
}

function readInt32(bb: ByteBuffer): number {
  let offset = advance(bb, 4);
  let bytes = bb.bytes;
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  );
}

function writeInt32(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 4);
  let bytes = bb.bytes;
  bytes[offset] = value;
  bytes[offset + 1] = value >> 8;
  bytes[offset + 2] = value >> 16;
  bytes[offset + 3] = value >> 24;
}

function readInt64(bb: ByteBuffer, unsigned: boolean): Long {
  return {
    low: readInt32(bb),
    high: readInt32(bb),
    unsigned,
  };
}

function writeInt64(bb: ByteBuffer, value: Long): void {
  writeInt32(bb, value.low);
  writeInt32(bb, value.high);
}

function readVarint32(bb: ByteBuffer): number {
  let c = 0;
  let value = 0;
  let b: number;
  do {
    b = readByte(bb);
    if (c < 32) value |= (b & 0x7f) << c;
    c += 7;
  } while (b & 0x80);
  return value;
}

function writeVarint32(bb: ByteBuffer, value: number): void {
  value >>>= 0;
  while (value >= 0x80) {
    writeByte(bb, (value & 0x7f) | 0x80);
    value >>>= 7;
  }
  writeByte(bb, value);
}

function readVarint64(bb: ByteBuffer, unsigned: boolean): Long {
  let part0 = 0;
  let part1 = 0;
  let part2 = 0;
  let b: number;

  b = readByte(bb);
  part0 = b & 0x7f;
  if (b & 0x80) {
    b = readByte(bb);
    part0 |= (b & 0x7f) << 7;
    if (b & 0x80) {
      b = readByte(bb);
      part0 |= (b & 0x7f) << 14;
      if (b & 0x80) {
        b = readByte(bb);
        part0 |= (b & 0x7f) << 21;
        if (b & 0x80) {
          b = readByte(bb);
          part1 = b & 0x7f;
          if (b & 0x80) {
            b = readByte(bb);
            part1 |= (b & 0x7f) << 7;
            if (b & 0x80) {
              b = readByte(bb);
              part1 |= (b & 0x7f) << 14;
              if (b & 0x80) {
                b = readByte(bb);
                part1 |= (b & 0x7f) << 21;
                if (b & 0x80) {
                  b = readByte(bb);
                  part2 = b & 0x7f;
                  if (b & 0x80) {
                    b = readByte(bb);
                    part2 |= (b & 0x7f) << 7;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    low: part0 | (part1 << 28),
    high: (part1 >>> 4) | (part2 << 24),
    unsigned,
  };
}

function writeVarint64(bb: ByteBuffer, value: Long): void {
  let part0 = value.low >>> 0;
  let part1 = ((value.low >>> 28) | (value.high << 4)) >>> 0;
  let part2 = value.high >>> 24;

  // ref: src/google/protobuf/io/coded_stream.cc
  let size =
    part2 === 0
      ? part1 === 0
        ? part0 < 1 << 14
          ? part0 < 1 << 7
            ? 1
            : 2
          : part0 < 1 << 21
          ? 3
          : 4
        : part1 < 1 << 14
        ? part1 < 1 << 7
          ? 5
          : 6
        : part1 < 1 << 21
        ? 7
        : 8
      : part2 < 1 << 7
      ? 9
      : 10;

  let offset = grow(bb, size);
  let bytes = bb.bytes;

  switch (size) {
    case 10:
      bytes[offset + 9] = (part2 >>> 7) & 0x01;
    case 9:
      bytes[offset + 8] = size !== 9 ? part2 | 0x80 : part2 & 0x7f;
    case 8:
      bytes[offset + 7] = size !== 8 ? (part1 >>> 21) | 0x80 : (part1 >>> 21) & 0x7f;
    case 7:
      bytes[offset + 6] = size !== 7 ? (part1 >>> 14) | 0x80 : (part1 >>> 14) & 0x7f;
    case 6:
      bytes[offset + 5] = size !== 6 ? (part1 >>> 7) | 0x80 : (part1 >>> 7) & 0x7f;
    case 5:
      bytes[offset + 4] = size !== 5 ? part1 | 0x80 : part1 & 0x7f;
    case 4:
      bytes[offset + 3] = size !== 4 ? (part0 >>> 21) | 0x80 : (part0 >>> 21) & 0x7f;
    case 3:
      bytes[offset + 2] = size !== 3 ? (part0 >>> 14) | 0x80 : (part0 >>> 14) & 0x7f;
    case 2:
      bytes[offset + 1] = size !== 2 ? (part0 >>> 7) | 0x80 : (part0 >>> 7) & 0x7f;
    case 1:
      bytes[offset] = size !== 1 ? part0 | 0x80 : part0 & 0x7f;
  }
}

function readVarint32ZigZag(bb: ByteBuffer): number {
  let value = readVarint32(bb);

  // ref: src/google/protobuf/wire_format_lite.h
  return (value >>> 1) ^ -(value & 1);
}

function writeVarint32ZigZag(bb: ByteBuffer, value: number): void {
  // ref: src/google/protobuf/wire_format_lite.h
  writeVarint32(bb, (value << 1) ^ (value >> 31));
}

function readVarint64ZigZag(bb: ByteBuffer): Long {
  let value = readVarint64(bb, /* unsigned */ false);
  let low = value.low;
  let high = value.high;
  let flip = -(low & 1);

  // ref: src/google/protobuf/wire_format_lite.h
  return {
    low: ((low >>> 1) | (high << 31)) ^ flip,
    high: (high >>> 1) ^ flip,
    unsigned: false,
  };
}

function writeVarint64ZigZag(bb: ByteBuffer, value: Long): void {
  let low = value.low;
  let high = value.high;
  let flip = high >> 31;

  // ref: src/google/protobuf/wire_format_lite.h
  writeVarint64(bb, {
    low: (low << 1) ^ flip,
    high: ((high << 1) | (low >>> 31)) ^ flip,
    unsigned: false,
  });
}
