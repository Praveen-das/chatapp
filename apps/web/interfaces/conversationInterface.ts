import {
  IConversation as _IConversation,
  IGroupConversation as _IGroupConversation,
  IUserConversation as _IUserConversation,
  ISystemConversation,
} from "@repo/interfaces/conversationInterface";
import { MessageReadReceipt } from "@repo/interfaces/messageInterface";
import { Override } from "@repo/interfaces/type";

type IGroupConversation = Override<_IGroupConversation, { displayName?: string }>;
export type IUserConversation = _IUserConversation;

export type IConversation = (IGroupConversation | IUserConversation | ISystemConversation) & {
  readReceipt?: Record<string, MessageReadReceipt> & Object
};
