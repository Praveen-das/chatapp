import { Schema, Types, model } from "mongoose";

export const messageReadReceiptSchema = new Schema({
  userId: Types.ObjectId,
  senderId: Types.ObjectId,
  conversationId: Types.ObjectId,
  lastDeliveredMessageTimestamp: Number,
  lastReadMessageTimestamp: Number,
});

export const readReceiptSchema = new Schema({
  conversationId: Types.ObjectId,
  readReceipts: [{ type: Types.ObjectId, ref: "messageReadReceipt" }],
  version: { type: Number, default: 0 },
});

messageReadReceiptSchema.index({ conversationId: 1, userId: 1,senderId:1 });

const MessageReadReceipt = model("messageReadReceipt", messageReadReceiptSchema);

export default MessageReadReceipt;
