import { Types } from "mongoose";

export interface IUser {
  id: string;
  username: string;
  phoneNumber: string;
  bio?: string;
  tags?: string[];
  profilePicture: string;
  rules?: IUserRules;
  status?: "online" | "offline";
  lastSeen?: number;
  createdAt: number;
  updatedAt: number;
  self?: boolean;
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

export interface IRule {
  isVisible: boolean;
}

export interface IUserRules {
  profilePicture: IRule;
  bio: IRule;
  lastSeen: IRule;
  readReceipts: IRule;
}

export interface IUserRuleChangeRequest {
  userId: string;
  updates: { rules: Partial<IUser["rules"]> };
}
