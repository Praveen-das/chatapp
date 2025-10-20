// interface IGroupConversation extends IConversationBase {
//   _id?:string
//   userId: string;
//   conversationId: string;
//   channelId: string;
//   invitationId?: string;
//   members: IUser[];
//   joinedAt: number
//   host: "group";
// }

import { IGroupConversation as _IGroupConversation, IGroupMember } from "@repo/interfaces/conversationInterface";
import { Override } from "@repo/interfaces/type";

export type IGroupConversation = Override<_IGroupConversation, 
{ 
    _id?: string 
    members: IGroupMember[]
}>;