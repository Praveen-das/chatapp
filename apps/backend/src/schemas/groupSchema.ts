import { z } from "zod";
import { objectId } from "./objectId";

export const memberSchema = z.object({
  conversationId: objectId,
  userId: objectId,
  joinedAt: z.number(),
  exitedAt: z.number().optional(),
});

export const conversationClearReq = z.object({
  groupId: objectId,
  userId: objectId,
  recentMember:objectId
});

export const groupSchema = z.object({
  id: objectId,
  channelId: objectId,
  displayName: z.string().min(3).max(20),
  profilePicture: z.string().optional(),
  tags: z.array(z.string()).optional(),
  admins: z.array(z.string()),
  host: z.literal("group"),
  members: z.array(memberSchema),
  createdBy: objectId,
});

export const groupConversationSchema = z.object({
  id: objectId,
  userId: objectId,
  conversationId: objectId,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const groupMemberSchema = z.object({
  _id: objectId,
  conversationId: objectId,
  userId: objectId,
  joinedAt: z.number(),
});

export const groupMembersSchema = z.array(groupMemberSchema)

export const groupConversationsSchema = z.array(groupConversationSchema);
