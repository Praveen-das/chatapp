import { IUserConversation } from "@interfaces/conversationInterface";
import { IUser } from "@interfaces/userInterface";
import ObjectID from "bson-objectid";

export function generateConversation(
  sender: IUser,
  receiver: IUser
): IUserConversation {
  return {
    id: new ObjectID().toHexString(),
    displayName: receiver.username,
    host: "user",
    members: [
      { id: sender.id, timeOfJoining: Date.now() } as any,
      { id: receiver.id, timeOfJoining: Date.now() } as any,
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    unsaved: true,
  };
}
