import { Override } from "@repo/interfaces/type";
import { IGroup as _IGroup } from "@repo/interfaces/groupInterface";
import { IGroupMember } from "@repo/interfaces/conversationInterface";

export type IGroup = Override<
  _IGroup,
  {
    _id?: string;
    id: string;
    channelId: string;
    invitationId?: string;
    members: IGroupMember[];
    admins: string[];
    createdBy: string;
  }
>;
