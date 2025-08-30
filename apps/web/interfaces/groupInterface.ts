import { IGroupMember } from "@repo/interfaces/conversationInterface";
import { IGroup as _IGroup } from "@repo/interfaces/groupInterface";
import { Override } from "@repo/interfaces/type";

export type IGroup = Override<
  _IGroup,
  {
    id: string;
    createdBy: string;
    admins:string[]
    members:IGroupMember[]
  }
>;
