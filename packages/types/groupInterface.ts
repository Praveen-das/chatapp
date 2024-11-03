import ObjectID from "bson-objectid";
import { IGroupMember } from "./conversationInterface";
import { IMessage } from "./messageInterface";

export interface IGroupCreationReq {
  id: string;
  displayName: string;
  members: string[];
  createdBy: string;
  admins: string[];
}
