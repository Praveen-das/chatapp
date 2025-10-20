import { Types } from "mongoose";
import { IMessage } from "./messageInterface";
import { IUser } from "./userInterface";
import { MemberReq } from "./groupInterface";

export interface INewConversation {
  id: string;
  host: "user";
  members: string[];
  createdAt: number;
  updatedAt: number;
}

export type IUserBlockRequest = {
  userConversation?: IUserConversation;
  userConversations?: IUserConversation[];
  conversation?: INewConversation | IConversation;
};

export type GenerateConversationProps = {
  blocked: {
    userId: string;
  };
};

export type IConversation = IUserConversation | IGroupConversation | ISystemConversation;

export interface IConversationBase {
  id: string;
  userId: string;
  conversationId: string;
  active?: boolean;

  messages?: IMessage[];
  recentMessage?: IMessage | null;
  tags?: string[];

  archived?: boolean;
  starred?: IMessage[];
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface IUserConversation extends IConversationBase {
  host: "user";
  members: [IUser, IUser];
  displayName?: string;

  blocked?: boolean;
  blockedByUser?: boolean;
}

export type IActivityLog = {
  conversationId: string;
  userId: string;
  joinedAt: number;
};

export interface IGroupConversation extends IConversationBase {
  host: "group";
  displayName?: string;
  members: IGroupMember[];

  channelId?: string;
  invitationId?: string;
  desc?: string;
  admins: string[];
  createdBy?: string;
  profilePicture: string;
  currentParticipation?:MemberReq
}

export interface ISystemConversation extends IConversationBase {
  host: "system";
}

export interface IDeleteRequest {
  conversation: IConversation;
  messages: Partial<IMessage>[];
}

export interface IGroupMember extends IUser {
  isAdmin: boolean;
  memberId?: string;
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
