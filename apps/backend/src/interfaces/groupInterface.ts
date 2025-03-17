import { Types } from "mongoose";
import { IMember } from "./conversationInterface";

export interface IGroup {
  _id: Types.ObjectId,
  id: Types.ObjectId,
  channelId: Types.ObjectId,
  invitationId?: Types.ObjectId,
  displayName:string,
  desc:string,
  profilePicture: string,
  admins: Types.ObjectId[],
  tags: string[],
  host: 'group',
  members: Types.ObjectId[],
  createdBy: Types.ObjectId,
  createdAt: number,
  updatedAt: number,
}
