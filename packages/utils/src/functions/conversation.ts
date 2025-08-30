import { IUser } from "@repo/interfaces/userInterface";
import { INewConversation, IUserConversation } from "@repo/interfaces/conversationInterface";
import { Types } from "mongoose";

export function handleGeneratingConversation(sender: IUser, receiver: IUser) {
  const conversation = generateConversation(sender, receiver);
  const userConversations = generateUserConversations(conversation);

  return { conversation, userConversations };
}

export function handleGeneratingSystemConversation(sender: IUser, receiver: IUser) {
  const conversation = generateConversation(sender, receiver);
  const userConversations = generateUserConversations(conversation);

  return { conversation, userConversations };
}

export function generateConversation(sender: IUser, receiver: IUser): INewConversation {
  return {
    id: new Types.ObjectId().toHexString(),
    host: "user",
    members: [sender, receiver],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function generateUserConversations(conversation: INewConversation): IUserConversation[] {
  return conversation.members.map((member) => ({
    id: new Types.ObjectId().toHexString(),
    userId: member.id,
    conversationId: conversation.id,
    members: conversation.members,
    host: conversation.host,
    active: false,

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
    id: new Types.ObjectId().toHexString(),
    channelId: crypto.randomUUID(),
    invitationId: new Types.ObjectId().toHexString(),
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
