import { IUserConversation } from "@interfaces/conversationInterface";
import { IUser } from "@interfaces/userInterface";
import ObjectID from "bson-objectid";

export function generateConversation(
  sender: IUser,
  receiver: IUser
): IUserConversation {
  console.log("generating new conversation");
  return {
    id: new ObjectID().toHexString(),
    displayName: receiver.username,
    host: "user",
    members: [sender, receiver],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    unsaved: true,
  };
}
