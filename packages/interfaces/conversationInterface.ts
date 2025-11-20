import { Types } from "mongoose";
import { IMessage } from "./messageInterface";
import { IUser } from "./userInterface";
import { MemberReq } from "./groupInterface";

export interface INewConversation {
  id: string;
  host: "user";
  members: [string,string];
  blocked?: [string];
}

export type IUserBlockRequest = {
  conversationId: string;
  blocked: boolean;
  blockedList?: string[];
  blockedId?: string;
};

export type GenerateConversationProps = {
  blocked: [string];
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
  createdAt?: number;
  updatedAt: number;
  version?: number;
}

export interface IUserConversation extends IConversationBase {
  host: "user";
  members: [IMember, IMember];
  displayName?: string;

  blockedList?: string[];
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
  currentParticipation?: MemberReq;
}

export interface ISystemConversation extends IConversationBase {
  host: "system";
}

export interface IDeleteRequest {
  conversation: IConversation;
  messages: Partial<IMessage>[];
}

export interface IMember {
  _id?: string;
  conversationId: string;
  userId: string;
  joinedAt: number;
  clearedAt?: number;
}

export interface IGroupMember {
  _id: string;
  isAdmin?: boolean;
  conversationId: string;
  userId: string;
  joinedAt: number;
  exitedAt?: number;
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

export interface IDeleteConversationRequest {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  deletedForUser?: boolean;
  timeOfDeletion?: number;
}
