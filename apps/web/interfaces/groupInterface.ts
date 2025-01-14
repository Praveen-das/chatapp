import ObjectID from "bson-objectid";
import { IGroupMember } from "./conversationInterface";
import { IMessage } from "./messageInterface";
import { IUser } from "./userInterface";

export interface IGroupCreationReq {
  id: string,
  channelId: string,
  invitationId?: string,
  displayName:string,
  profilePicture: string,
  admins: string[],
  host: string,
  members: IUser[],
  createdBy: string,
  createdAt: number,
  updatedAt: number,
}
