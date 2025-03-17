import { IConversation, INewConversation, IUserConversation } from "@interfaces/conversationInterface";
import { IUser } from "@interfaces/userInterface";
import ObjectID from "bson-objectid";
import { useConversationStore } from "store/conversationStore";

export function generateConversation(sender: IUser, receiver: IUser): INewConversation {
  return {
    id: new ObjectID().toHexString(),
    host: "user",
    members: [sender, receiver],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function generateUserConversations(conversation: INewConversation): IUserConversation[] {
  return conversation.members.map((member) => ({
    id: new ObjectID().toHexString(),
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

export function findUserConversation(userId: string) {
  const conversations = useConversationStore.getState().conversations;
  const conversation = conversations.find((c) => c.host === "user" && c.members.some((m) => m.id === userId));
  return conversation;
}

export const getReceiver = (c: IConversation) => (c?.host === "user" ? c.members.find((m) => m.id !== c.userId) : null);
