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
});

export const conversationSchema = z.object({
  id: objectId,
  host: z.union([z.literal("user"), z.literal("system")]),
  members: z.array(objectId).optional(),
  blockedList: z.array(objectId).optional(),
});

export const userConversationSchema = z.object({
  id: objectId,
  userId: objectId,
  conversationId: objectId,
  active: z.boolean().default(true).optional(),
});

export const conversationBlockRequest = z.object({
  conversationId: objectId,
  blocked: z.boolean(),
  blockedId: objectId,
  blockedList:z.array(z.object({ userId: objectId, blockedBy: objectId })),
});

export const userConversationsSchema = z.array(userConversationSchema);
