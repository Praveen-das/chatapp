import { IGroupMember } from "@repo/interfaces/conversationInterface";
import { IGroup as _IGroup, MemberReq } from "@repo/interfaces/groupInterface";
import { Override } from "@repo/interfaces/type";

export type IActivityLog = { joinedAt: number; exitedAt: number }

export type IGroup = Override<
  _IGroup,
  {
    id: string;
    channelId: string;
    invitationId?: string;
    createdBy: string;
    admins:string[]
    members:IGroupMember[]
  }
>;

export type IGroupCreationRequest = Override<
  IGroup,
  {
    members:MemberReq[]
  }
>;