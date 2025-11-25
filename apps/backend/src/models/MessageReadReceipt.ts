import { Schema, Types, model } from "mongoose";

export const messageReadReceiptSchema = new Schema({
  userId: Types.ObjectId,
  senderId: Types.ObjectId,
  conversationId: Types.ObjectId,
  lastDeliveredMessageTimestamp: Number,
  lastReadMessageTimestamp: Number,
  updatedAt: { type: Number, default: 0 },
});

messageReadReceiptSchema.index({ conversationId: 1, userId: 1, senderId: 1 });

const MessageReadReceipt = model("messageReadReceipt", messageReadReceiptSchema);

export default MessageReadReceipt;
