import { Types } from "mongoose";
import { z } from "zod";
import { objectId } from "./objectId";

const urlMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string(),
  error: z.number().optional(),
});

const urlAttachmentSchema = z.object({
  id: z.string(),
  type: z.literal("link"),
  host: z.string(),
  url: z.string().url(),
  metadata: urlMetadataSchema.optional(),
});

const imagePayloadSchema = z.object({
  fileId: z.string().optional(),
  name: z.string(),
  size: z.number(),
  filePath: z.string().optional(),
  url: z.string().url(),
  fileType: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  thumbnailUrl: z.string().optional(),
});

const imageAttachmentSchema = imagePayloadSchema.extend({
  id: z.string(),
  type: z.literal("images"),
  sender: z.string().optional(),
  status: z.enum(["uploading", "success"]).optional(),
});

const attachmentSchema = z.discriminatedUnion("type", [imageAttachmentSchema, urlAttachmentSchema]);

const readReceiptSchema = z.object({
  userId: z.string(),
  status: z.number(),
});

const messageReplySchema = z.object({
  messageId: z.string(),
  userId: z.string(),
  message: z.string(),
  attachment: attachmentSchema.optional(),
});

export const userMessageSchema = z
  .object({
    id: objectId,
    conversationId: objectId,
    from: z.union([objectId, z.literal("system")]),
    to: objectId.optional(),
    message: z.string(),
    readReceipt: z.array(readReceiptSchema).optional(),
    timestamp: z.number(),
    attachment: attachmentSchema.optional(),
    reply: messageReplySchema.optional(),
    deleted: z.boolean().optional(),
    type: z.enum(["message", "placeholder", "service_message", "notification"]),
  })

export const messagesSchema = z.array(userMessageSchema);
