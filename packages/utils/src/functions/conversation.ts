import { IUser } from "@repo/interfaces/userInterface";
import {
  GenerateConversationProps,
  IMember,
  INewConversation,
  IUserConversation,
} from "@repo/interfaces/conversationInterface";
import { Types } from "mongoose";

export function handleGeneratingConversation(members: [IUser, IUser], options?: GenerateConversationProps) {
  const conversationId = new Types.ObjectId().toHexString();

  const participants = members.map((c) => ({
    _id: new Types.ObjectId().toHexString(),
    conversationId,
    joinedAt: Date.now(),
    userId: c.id,
  })) as [IMember, IMember];

  const conversation = generateConversation(conversationId, participants, options);
  const userConversations = generateUserConversations(conversation, participants);

  return { conversation, participants, userConversations };
}

export function handleGeneratingSystemConversation(conversationId: string, members: [IMember, IMember]) {
  const conversation = generateConversation(conversationId, members);
  const userConversations = generateUserConversations(conversation, members);

  return { conversation, userConversations };
}

export function generateConversation(
  conversationId: string,
  members: [IMember, IMember],
  options?: GenerateConversationProps
): INewConversation {
  return {
    id: conversationId,
    host: "user",
    members: members.map((m) => m._id) as [string,string],
    blocked: options?.blocked,
  };
}

export function generateUserConversations(
  conversation: INewConversation,
  members: [IMember, IMember]
): IUserConversation[] {
  return members.map((member) => {
    const c: IUserConversation = {
      id: new Types.ObjectId().toHexString(),
      userId: member.userId,
      conversationId: conversation.id,
      members,
      host: conversation.host,
      active: false,
      updatedAt: Date.now(),
    };
    return c;
  });
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
