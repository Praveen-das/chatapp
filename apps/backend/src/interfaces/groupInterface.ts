import { Types } from "mongoose";
import { IMember } from "./conversationInterface";

export interface IGroup {
  id: Types.ObjectId;
  channelId: Types.ObjectId;
  invitationId?: Types.ObjectId;
  displayName: string;
  createdBy: string;
  admins: Types.ObjectId[];
  host: "group";
  members: IMember[];
  createdAt: number;
  updatedAt: number;
}
