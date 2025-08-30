import { z } from "zod";
import { objectId } from "./objectId";

export const groupSchema = z.object({
  id: objectId,
  channelId: objectId,
  displayName:z.string().min(3).max(20),
  profilePicture: z.string().url(),
  tags: z.array(z.string()).optional(),
  admins: z.array(z.string()),
  host: z.literal("group"),
  members: z.array(objectId),
  createdBy: objectId,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const groupConversationSchema = groupSchema.extend({
  conversationId: objectId,
  userId: objectId,
  active: z.boolean().default(true),
  joinedAt: z.number(),
});

export const groupConversationsSchema = z.array(groupConversationSchema);
