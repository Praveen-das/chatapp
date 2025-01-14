import { Types } from "mongoose";
import { IMember } from "./conversationInterface";

export interface IGroup {
  id: Types.ObjectId,
  channelId: Types.ObjectId,
  invitationId?: Types.ObjectId,
  displayName:string,
  desc:string,
  profilePicture: string,
  admins: Types.ObjectId[],
  host: 'group',
  members: Types.ObjectId[],
  createdBy: Types.ObjectId,
  createdAt: number,
  updatedAt: number,
}
