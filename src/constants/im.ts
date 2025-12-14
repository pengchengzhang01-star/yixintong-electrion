import { MessageType, SessionType } from "@openim/wasm-client-sdk";

export const GroupSessionTypes = [SessionType.Group, SessionType.WorkingGroup];

export const GroupSystemMessageTypes = [
  MessageType.GroupCreated,
  MessageType.GroupInfoUpdated,
  MessageType.MemberQuit,
  MessageType.GroupOwnerTransferred,
  MessageType.MemberKicked,
  MessageType.MemberInvited,
  MessageType.MemberEnter,
  MessageType.GroupDismissed,
  MessageType.GroupMemberMuted,
  MessageType.GroupMuted,
  MessageType.GroupCancelMuted,
  MessageType.GroupMemberCancelMuted,
  MessageType.GroupNameUpdated,
];

export const SystemMessageTypes = [
  MessageType.RevokeMessage,
  MessageType.FriendAdded,
  MessageType.BurnMessageChange,
  MessageType.MsgPinned,
  ...GroupSystemMessageTypes,
];

export const CustomMessageType = {
  Call: 100,
  MassMsg: 903,
  MeetingInvitation: 905,
};

export enum RtcMessageStatus {
  Refused,
  Canceled,
  Timeout,
  Successed,
  Interrupt,
  HandleByOtherDevice,
  UnknownDisconnect,
}

export const canSearchMessageTypes = [
  MessageType.TextMessage,
  MessageType.AtTextMessage,
  MessageType.FileMessage,
  MessageType.QuoteMessage,
  MessageType.PictureMessage,
  MessageType.VideoMessage,
  MessageType.CardMessage,
  MessageType.LocationMessage,
  MessageType.VoiceMessage,
  MessageType.CustomMessage,
];

// message render context: some types of messages have different handling in different render contexts,
// such as RtcMessage only can be clicked to re-call in Chat page
export enum MessageRenderContext {
  Chat = "Chat",
  MergeMessage = "MergeMessage",
  CollectionPreview = "CollectionPreview", // Favorites page left preview list
  CollectionDetail = "CollectionDetail", // Favorites page right detail part
  Search = "Search",
}
