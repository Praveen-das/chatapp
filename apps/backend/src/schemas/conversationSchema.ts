import { z } from "zod";
import { objectId } from "./objectId";

export const systemConversationSchema = z.object({
  id: objectId,
  host: z.literal("system"),
  userId: objectId,
  conversationId: objectId,
  active: z.boolean(),
  archived: z.boolean(),
  starred: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const conversationSchema = z.object({
  id: objectId,
  host: z.union([z.literal("user"), z.literal("system")]),
  members: z.array(objectId).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const userConversationSchema = z.object({
  id: objectId,
  userId: objectId,
  conversationId: objectId,
  active: z.boolean().default(true).optional(),
  blocked: z.boolean().default(false).optional(),
  blockedByUser: z.boolean().default(false).optional(),
  // members: z.array(objectId).optional(),
  // host: z.literal("user"),
  // createdAt: z.number(),
  // updatedAt: z.number(),
});

export const conversationBlockRequest = z.object({
  value: z.boolean(),
  conversationId: objectId,
  userId: objectId,
  requestedUserId: objectId,
});

export const userConversationsSchema = z.array(userConversationSchema);
