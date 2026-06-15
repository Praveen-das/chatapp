import { Types } from "mongoose";

export type IUserRules =
  | "hide_profilepicture"
  | "hide_bio"
  | "hide_lastseen"
  | "hide_readreceipts"
  | "disable_chat_assist"
  | "disable_content_awareness";

export interface IPublicKeyVersion {
  publicKey: string; // JWK public key string
  activatedAt: number; // Epoch ms when this key became active
  status?: "active" | "archived" | "revoked";
}

export interface IUser {
  id: string;
  username: string;
  phoneNumber: string;
  bio?: string;
  tags?: string[];
  profilePicture: string;
  rules?: IUserRules[];
  status?: "online" | "offline";
  lastSeen?: number;
  createdAt: number;
  updatedAt: number;
  self?: boolean;
  version?: number;
  publicKey?: string;
  publicKeyHistory?: IPublicKeyVersion[];
  encryptedPrivateKey?: string;
}

export interface IBlocked {
  id: string;
  user: IUser;
  blockedUser: IUser;
}

export interface IUBlockReq {
  id: Types.ObjectId;
  userId: Types.ObjectId;
  blockedId: Types.ObjectId;
}

export interface IUserRuleChangeRequest {
  userId: string;
  rule: IUserRules;
  action: "add" | "remove";
}
