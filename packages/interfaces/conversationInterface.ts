import { Types } from "mongoose";
import { IMessage } from "./messageInterface";
import { IUser } from "./userInterface";

export interface INewConversation {
  id: string;
  host: "user";
  members: [IUser, IUser];
  createdAt: number;
  updatedAt: number;
}

export type IUserBlockRequest = {
  userConversation?: IUserConversation;
  userConversations?: IUserConversation[];
  conversation?: INewConversation | IConversation;
};

export type IConversation = IUserConversation | IGroupConversation | ISystemConversation;

export interface IConversationBase {
  id: string;
  userId: string;
  conversationId: string;
  active?: boolean;

  messages?: IMessage[];
  recentMessage?: IMessage | null;
  
  archived?: boolean;
  starred?: IMessage[];
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface IUserConversation extends IConversationBase {
  host: "user";
  members: [IUser, IUser];

  blocked?: boolean;
  blockedByUser?: boolean;
}

export interface IGroupConversation extends IConversationBase {
  host: "group";
  displayName: string;
  members: IGroupMember[];
  tags: string[];

  channelId?: string;
  invitationId?: string;
  desc?: string;
  admins: string[];
  createdBy?: string;
  joinedAt: number;
  profilePicture: string;
}

export interface ISystemConversation {
  id: string;
  conversationId: string;
  host: "system";
  userId: string;
  messages?: IMessage[];
  recentMessage?: IMessage | null;
  active?: boolean;
  archived?: boolean;
  starred?: IMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface IDeleteRequest {
  conversation: IConversation;
  messages: Partial<IMessage>[];
}

export interface IGroupMember extends IUser {
  isAdmin: boolean;
  timeOfJoining: number;
}

export interface IClearConversationRequest {
  conversationId: string;
  userId: string;
  deletedForUser?: boolean;
  timeOfDeletion: number;
}

export interface IDeleteForUserRequest {
  conversationId: string;
  collection: {
    userId: string;
    messageId: string;
  }[];
}

export interface IQueryResult {
  chats: IUserConversation[];
  groups: IGroupConversation[];
  contacts: IUserConversation[];
}

export interface IUpdateBlockReq {
  conversationId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  requestedUserId: Types.ObjectId | string;
  value: boolean;
}

export interface IDeleteConversationRequest {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  deletedForUser?: boolean;
  timeOfDeletion?: number;
}
