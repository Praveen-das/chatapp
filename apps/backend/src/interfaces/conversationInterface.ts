import { Types } from "mongoose";
import { IUser } from "./userInterface";

export interface IMember {
  id: Types.ObjectId;
  timeOfDeletion?: Number;
  deletedForUser?: Boolean;
}

export interface IConversation {
  id: Types.ObjectId;
  host: "user";
  members: Types.ObjectId[];
  createdAt: number;
  updatedAt: number;
}

export interface IUserConversation {
  id: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId: Types.ObjectId;
  host: "user";

  active?: boolean;
  archived?: boolean;
  starred?: Types.ObjectId;
  blocked: boolean;
  blockedByUser: boolean;

  deletedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface IGroupConversation {
  id: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId: Types.ObjectId;

  active?: boolean;
  archived?: boolean;
  starred: Types.ObjectId[],

  joinedAt: number;
  deletedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface IDeleteConversationRequest {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  deletedForUser?: boolean;
  timeOfDeletion?: number;
}

export interface IUpdateBlockReq {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  requestedUserId: Types.ObjectId;
  value: boolean;
}
