import ObjectID from "bson-objectid";
import { IGroupConversation, IGroupMember } from "./conversationInterface";
import { IMessage } from "./messageInterface";
import { IUser } from "./userInterface";
import { Types } from "mongoose";

export interface IGroupCreationReq {
  groupId: string;
  displayName: string;
  profilePicture: string;
  selectedMembers: IUser[];
}

export type MemberReq = {
  _id: string;
  conversationId: string;
  userId: string;
  joinedAt: number;
  exitedAt?: number;
};

export type GroupDeleteReq = { groupId: string; conversationId: string; channelId: string; userId: string };
export type GroupClearReq = {
  conversationId: string;
  groupId: string;
  recentMember: string;
  userId: string;
};

export interface IGroup {
  _id?: Types.ObjectId;
  id: Types.ObjectId;
  channelId: Types.ObjectId;
  invitationId?: Types.ObjectId;
  displayName: string;
  desc?: string;
  profilePicture: string;
  admins: Types.ObjectId[];
  tags?: string[];
  host: "group";
  members: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt?: number;
  updatedAt?: number;
  version?: number;
}

export type JoinGroupParams = {
  conversation: IGroupConversation;
  user: IUser;
  create: boolean;
};
