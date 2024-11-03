import { IMessage } from "./messageInterface";
import { IUser } from "./userInterface";

export interface IConversationBase {
  id: string;
  displayName?: string;
  profilePicture?: string;
  createdAt: number;
  updatedAt: number;
  messages?: IMessage[];

  recentMessage?: IMessage;
  unsaved?: boolean;
  deletedUsers?: string[] | null;
  isArchived?: boolean;
  archived?: string[];
}

export interface IUserConversation extends IConversationBase {
  host: "user";
  members: IUser[];
}

export interface IGroupConversation extends IConversationBase {
  channelId?: string;
  invitationId?: string;
  desc?: string;
  host: "group";
  members: IGroupMember[];
  admins: string[];
  createdBy?:string
}

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
