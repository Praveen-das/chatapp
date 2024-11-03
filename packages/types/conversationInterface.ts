import { IMessage } from "./messageInterface";
import { IUser } from "./userInterface";

export interface IUserConversation {
  id: string;
  displayName?: string;
  profilePicture?: string;
  host: "user";
  members: IUser[];
  createdAt: number;
  updatedAt: number;
  messages?: IMessage[];
  recentMessage?: IMessage;
  unsaved?: boolean;
  deletedForUser?: boolean;
}

export interface IGroupConversation {
  id: string;
  channelId?: string;
  invitationId?: string;
  displayName?: string;
  profilePicture?: string;
  desc?: string;
  host: "group";
  members: IGroupMember[];
  createdBy: string;
  admins: string[];
  messages?: IMessage[];
  createdAt: number;
  updatedAt: number;
  recentMessage?: IMessage;
  unsaved?: boolean;
}

export type IConversation = IUserConversation | IGroupConversation;

export interface IDeleteRequest {
  conversation: IConversation;
  messages: Partial<IMessage>[];
}

export interface IGroupMember extends IUser {
  isAdmin: boolean;
}

export interface IDeleteConversationRequest {
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
