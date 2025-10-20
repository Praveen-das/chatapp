import { IGroupMember } from "@repo/interfaces/conversationInterface";
import {
  IConversation as _IConversation,
  IGroupConversation as _IGroupConversation,
  IUserConversation as _IUserConversation,
  ISystemConversation,
} from "@repo/interfaces/conversationInterface";
import { MemberReq } from "@repo/interfaces/groupInterface";
import { Override } from "@repo/interfaces/type";

type IGroupConversation = Override<_IGroupConversation, { displayName?: string }>;
type IUserConversation = _IUserConversation

export type IConversation = IGroupConversation | IUserConversation | ISystemConversation;
