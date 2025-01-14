import {
  INewConversation,
  IUserConversation,
} from "@interfaces/conversationInterface";
import { IUser } from "@interfaces/userInterface";
import ObjectID from "bson-objectid";

export function generateConversation(
  sender: IUser,
  receiver: IUser
): INewConversation {
  return {
    id: new ObjectID().toHexString(),
    host: "user",
    members: [sender, receiver],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function generateUserConversations(conversation: INewConversation):IUserConversation[] {
  return conversation.members.map((member) => ({
    id: new ObjectID().toHexString(),
    userId: member.id,
    conversationId: conversation.id,
    members: conversation.members,
    host: conversation.host,
    active: true,

    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
}

export function generateGroup({
  displayName,
  profilePictureUrl,
  userId,
  selectedGroupMembers,
}: {
  displayName: string;
  profilePictureUrl: string;
  userId: string;
  selectedGroupMembers: string[];
}) {
  return {
    id: new ObjectID().toHexString(),
    channelId: crypto.randomUUID(),
    invitationId: new ObjectID().toHexString(),
    displayName,
    profilePicture: profilePictureUrl,
    admins: [userId],
    host: "group",
    members: selectedGroupMembers,
    createdBy: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function handleGeneratingConversation(sender: IUser, receiver: IUser) {
  const conversation = generateConversation(sender, receiver);
  const userConversations = generateUserConversations(conversation);

  return { conversation, userConversations };
}
