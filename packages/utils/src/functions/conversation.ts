import { IUser } from "@repo/interfaces/userInterface";
import { GenerateConversationProps, INewConversation, IUserConversation } from "@repo/interfaces/conversationInterface";
import { Types } from "mongoose";

export function handleGeneratingConversation(members: [IUser, IUser], props?: GenerateConversationProps) {
  const conversation = generateConversation(members);
  const userConversations = generateUserConversations(conversation, members, props);

  return { conversation, userConversations };
}

export function handleGeneratingSystemConversation(members: [IUser, IUser]) {
  const conversation = generateConversation(members);
  const userConversations = generateUserConversations(conversation, members);

  return { conversation, userConversations };
}

export function generateConversation(members: [IUser, IUser]): INewConversation {
  return {
    id: new Types.ObjectId().toHexString(),
    host: "user",
    members: members.map(({ id }) => id),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function generateUserConversations(
  conversation: INewConversation,
  members: [IUser, IUser],
  props?: GenerateConversationProps
): IUserConversation[] {
  return members.map((member) => {
    const c: IUserConversation = {
      id: new Types.ObjectId().toHexString(),
      userId: member.id,
      conversationId: conversation.id,
      members,
      host: conversation.host,
      active: false,

      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (props?.blocked) {
      if (member.id === props.blocked.userId) c.blocked = true;
      else c.blockedByUser = true;
    }

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
