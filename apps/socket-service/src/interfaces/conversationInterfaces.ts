import {
  IGroupConversation as _IGroupConversation,
  IGroupMember as _IGroupMember,
} from "@repo/interfaces/conversationInterface";
import { Override } from "@repo/interfaces/type";

export type IGroupConversation = Override<
  _IGroupConversation,
  {
    _id?: string;
    members: IGroupMember[];
  }
>;

export type IGroupMember = _IGroupMember;
