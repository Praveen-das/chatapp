import { IMessage } from "./messageInterface";
import { IUser } from "./userInterface";

export interface INewConversation {
  id: string;
  host: "user";
  members: IUser[];
  createdAt: number;
  updatedAt: number;
}

export interface IConversationBase {
  id: string;
  userId: string;
  conversationId: string;
  displayName?: string;
  createdAt: number;
  updatedAt: number;
  messages?: IMessage[];
  recentMessage?: IMessage | null;
  active?: boolean;
  archived?: boolean;
  starred?: IMessage[];
}

export interface IUserConversation extends IConversationBase {
  host: "user";
  members: IUser[];

  blocked?: boolean;
  blockedByUser?: boolean;
}

export interface IGroupConversation extends IConversationBase {
  host: "group";
  members: IGroupMember[];

  profilePicture: string;
  channelId?: string;
  invitationId?: string;
  desc?: string;
  admins: string[];
  createdBy?: string;
  joinedAt: number;
}

// export interface IGroupConversation extends IConversationBase {
// }

export type IConversation = IUserConversation | IGroupConversation;

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

export interface IDeleteConversationRequest {
  conversation: IConversation;
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
