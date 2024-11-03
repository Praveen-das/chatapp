import { Types } from "mongoose";

export interface IMember{
  id: Types.ObjectId,
  timeOfDeletion?: Number,
  deletedForUser?: Boolean,
}

export interface IUserConversation {
  id: Types.ObjectId;
  host: "user";
  members: IMember[];
  createdAt: number;
  updatedAt: number;
  unsaved?: boolean;
  deletedUsers?: string[];
  archived?: string[];
}

export interface IDeleteConversationRequest {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  deletedForUser?: boolean;
  timeOfDeletion?:number
}