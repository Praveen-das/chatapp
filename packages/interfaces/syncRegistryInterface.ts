import { Types } from "mongoose";
import { IConversation } from "./conversationInterface";
import { IMessage } from "./messageInterface";

export type IdbValues = {
  lastKnownVersion: number;
  lastKnownMessageTimestamp?: number;
};

export type IIdbConversastionRecord = Record<string, IdbValues>;
export type IIdbUserRecordValue = { userId: string; version: number };
export type IIdbUserRecord = Record<string, IIdbUserRecordValue>;

export type RegisterValue = {
  conversationId: string;
  version: number;
  host: "group" | "user";
  messageTimestamp: number;
};

export type ConversationEntry = {
  conversationId?: string;
  lastKnownMessageTimestamp?: number;
  needSync?: boolean;
  newEntry?: boolean;
  host?: "group" | "user";
  unSyncUserIds?: string[];
};

export type ConversationFetchResponse = {
  needSync?: IConversation[];
  newEntry?: IConversation[];
  messages?: IMessage[];
};

export type SaveConversationSyncStateFieldValues = Array<keyof RegisterValue | (string & {}) | (number & {})>;
export type SaveConversationSyncState = {
  conversationId: Types.ObjectId | string;
  fieldValues: SaveConversationSyncStateFieldValues;
};
