import { Types } from "mongoose";
import { z } from "zod";
import { objectId } from "./objectId";

export const readReceiptSchema = z.object({
  conversationId: objectId,
  senderId: objectId,
  userId: objectId,
  lastDeliveredMessageTimestamp: z.number().optional(),
  lastReadMessageTimestamp: z.number().optional(),
  version: z.number().optional(),
});

export const readReceiptsSchema = z.array(readReceiptSchema);
