import { ChooseModalState } from "@/pages/common/ChooseModal";
import { CheckListItem } from "@/pages/common/ChooseModal/ChooseBox/CheckItem";
import mitt from "mitt";
import {
  GroupItem,
  GroupMemberItem,
  RtcInvite,
  RtcInviteResults,
} from "@openim/wasm-client-sdk/lib/types/entity";
import { InviteData } from "@/pages/common/RtcCallModal/data";
import { ExMessageItem } from "@/store";
import { RouteTravel } from "@/pages/common/MomentsModal";
import { RtcMessageStatus } from "@/constants";
import { ToSpecifiedConversationParams } from "@/hooks/useConversationToggle";
import { SendMessageParams } from "@/pages/chat/queryChat/ChatFooter/useSendMessage";
import { ReadyJumpToHistoryParams } from "@/hooks/useEventTransfer";
import { ViewType } from "@openim/wasm-client-sdk";

type EmitterEvents = {
  OPEN_USER_CARD: OpenUserCardParams;
  OPEN_GROUP_CARD: GroupItem;
  OPEN_CHOOSE_MODAL: ChooseModalState;
  OPEN_RTC_MODAL: InviteData;
  OPEN_MEETING_MODAL: RtcInviteResults;
  CHAT_LIST_SCROLL_TO_BOTTOM: void;
  SYNC_NEW_MSGS: void;
  // message store
  PUSH_NEW_MSG: ExMessageItem;
  UPDATE_ONE_MSG: ExMessageItem;
  UPDATE_MSG_NICK_AND_FACEURL: UpdateMessaggeBaseInfoParams;
  DELETE_ONE_MSG: string;
  DELETE_MSG_BY_USER: string;
  DELETE_AND_PUSH_ONE_MSG: ExMessageItem;
  LOAD_HISTORY_MSGS: void;
  GET_MSG_CONTEXT: GetMessageContextParams;
  GET_MSG_LIST: (messages: ExMessageItem[]) => void;
  CLEAR_MSGS: void;
  CLEAR_MSG_STATE: keyof ExMessageItem;

  UPDATE_IS_HAS_NEW_MESSAGES: boolean;
  SELECT_USER: SelectUserParams;
  OPEN_MOMENTS: RouteTravel;
  CLOSE_SEARCH_MODAL: void;
  ONLINE_STATE_CHECK: void;
  TYPING_UPDATE: void;
  TRY_JUMP_TO_UNREAD: void;
  TRIGGER_GROUP_AT: GroupMemberItem;
};

type WindowEmitterEvents = {
  // to main window
  USER_LOGOUT: void;
  JUMP_TO_SPECIFIED_CONVERSATION: ToSpecifiedConversationParams;
  REPEAT_JUMP_TO_HISTORY: ReadyJumpToHistoryParams;
  CALL_STORE_FUNCTION: CallStoreFunctionParams;

  // to main window (enterprise)
  INSERT_RTC_MESSAGE: RtcMessageData;
  INSERT_MEETING_MESSAGE: SendMessageParams;
  SET_MOMENTS_USER: RouteTravel;
  CLEAR_MOMENTS_UNREAD_COUNT: void;
  OPEN_MEETING_MODAL: RtcInviteResults;
  REPEAT_OPEN_MEETING: void;
};

export type SelectUserParams = {
  notConversation: boolean;
  choosedList: CheckListItem[];
};

export type OpenUserCardParams = {
  userID?: string;
  groupID?: string;
  isSelf?: boolean;
  notAdd?: boolean;
};

export type UpdateMessaggeBaseInfoParams = {
  sendID: string;
  senderNickname: string;
  senderFaceUrl: string;
};

export type GetMessageContextParams = {
  message: ExMessageItem;
  viewType: ViewType;
};

export type RtcMessageData = {
  status: RtcMessageStatus;
  duration?: string;
  invitation: RtcInvite;
};

export type CallStoreFunctionParams = {
  store: "contact" | "conversation" | "message" | "user";
  functionName: string;
  args: any[];
};

const emitter = mitt<EmitterEvents & WindowEmitterEvents>();

export const emit = emitter.emit;

export const emitToSpecifiedWindow = <K extends keyof WindowEmitterEvents>(
  event: K,
  args?: WindowEmitterEvents[K],
  target?: string,
) => {
  if (!window.electronAPI?.enableCLib) {
    // @ts-ignore
    emitter.emit(event, args);
    return;
  }
  window.electronAPI.sendEventTransfer({
    event,
    args: {
      ...args,
      target: target || "main",
    },
  });
};

export default emitter;
