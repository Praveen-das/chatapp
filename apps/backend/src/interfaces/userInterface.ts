import { Types } from "mongoose";

export interface IUser {
  id: Types.ObjectId;
  username: string;
  phoneNumber: string;
  bio: string;
  profilePicture?: string;
  createdAt: number;
  updatedAt: number;
}

export interface IUBlockReq {
  id: Types.ObjectId;
  userId: Types.ObjectId;
  blockedId: Types.ObjectId;
}
