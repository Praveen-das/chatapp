import {
  IConversation as _IConversation,
  IUserConversation as _IUserConversation,
  IGroupConversation as _IGroupConversation,
} from "@repo/interfaces/conversationInterface";
import { Override } from "@repo/interfaces/type";
import { Types } from "mongoose";

export type IConversation = Override<_IConversation, { id: Types.ObjectId; members: Types.ObjectId[] }>;

export type IUserConversation = Override<
  _IUserConversation,
  { id: Types.ObjectId; userId: Types.ObjectId; conversationId: Types.ObjectId }
>;

export type IGroupConversation = Override<
  _IGroupConversation,
  { id: Types.ObjectId; userId: Types.ObjectId; conversationId: Types.ObjectId }
>;
