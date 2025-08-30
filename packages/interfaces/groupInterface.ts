import ObjectID from "bson-objectid";
import { IGroupMember } from "./conversationInterface";
import { IMessage } from "./messageInterface";
import { IUser } from "./userInterface";
import { Types } from "mongoose";

export interface IGroupCreationReq {
  id: string,
  channelId: string,
  invitationId?: string,
  displayName:string,
  profilePicture: string,
  admins: string[],
  host: string,
  members: IUser[],
  createdBy: string,
  createdAt: number,
  updatedAt: number,
}

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
