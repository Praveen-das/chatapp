import { z } from "zod";
import { objectId } from "./objectId";

export const conversationSchema = z.object({
  id: objectId,
  host: z.union([z.literal("user"), z.literal("system"), z.literal("ai")]),
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
  blockedList: z.array(z.object({ userId: objectId, blockedBy: objectId })),
});

export const userConversationsSchema = z.array(userConversationSchema);
