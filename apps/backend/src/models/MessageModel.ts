import mongoose, { Schema, model } from "mongoose";
import { IAttachment, IImageAttachment, IUrlAttachment } from "@repo/interfaces/messageInterface";
import { IMessage } from "../interfaces/messageInterface";
import { syncRegistry } from "../lib/SyncRegistry";

const readReceiptSchema = new Schema({
  userId: Schema.Types.ObjectId,
  status: Number,
});

const imageAttachmentSchema = new mongoose.Schema<IImageAttachment>({
  id: Schema.Types.ObjectId,
  type: String,

  fileId: String,
  name: String,
  size: Number,
  filePath: String,
  url: String,
  fileType: String,
  thumbnailUrl: String,
});

const urlAttachmentSchema = new Schema<IUrlAttachment>({
  id: Schema.Types.ObjectId,
  type: String,
  host: String,
  url: String,
  metadata: {
    title: String,
    description: String,
    image: String,
    error: Number,
  },
});

const urlAttachmentModal = model("UrlAttachmentModal", urlAttachmentSchema);

const imageAttachmentModal = model("ImageAttachmentModal", imageAttachmentSchema);

function validator(_: any, v: any) {
  if (!v) return true;
  if (v.type === "images") return urlAttachmentModal.validate(v);
  if (v.type === "link") return imageAttachmentModal.validate(v);
  return false;
}

const replyMessageSchema = new Schema({
  message: String,
  messageId: Schema.Types.ObjectId,
  userId: Schema.Types.ObjectId,
  attachment: {
    type: Schema.Types.Mixed as unknown as IAttachment,
    validate: { validator },
  },
});

export const messageSchema = new Schema<IMessage>({
  id: Schema.Types.ObjectId,
  conversationId: Schema.Types.ObjectId,
  from: Schema.Types.Mixed,
  to: Schema.Types.ObjectId,
  message: String,
  timestamp:  { type: Number, default: () => Date.now() },
  type: {
    type: String,
    enum: ["message", "placeholder", "service_message", "notification"],
  },

  attachment: {
    type: Schema.Types.Mixed as unknown as IAttachment,
    validate: { validator },
  },
  reply: replyMessageSchema,
  readReceipt: [readReceiptSchema],
  deleted: {
    type: Boolean,
    default: false,
  },
});

const messageDeleteFlagSchema = new Schema<IMessageDeleteFlag>({
  userId: Schema.Types.ObjectId,
  messageId: Schema.Types.ObjectId,
  deleted: Boolean,
});

messageSchema.index({ hasAttachment: 1, timestamp: 1 });

messageSchema.post("insertMany", async (messages: IMessage[]) => {
  if (!messages?.length) return;

  let recentMessage = messages.at(-1);

  if (!recentMessage) return;

  let conversationId = recentMessage.conversationId.toHexString();
  let timestamp = recentMessage.timestamp;

  const res = await syncRegistry.saveConversationSyncState([
    { conversationId, fieldValues: ["messageTimestamp", timestamp] },
  ]);

  console.log("line:104-->", "inserted-->", res?.length);
});

const Messages = model("messages", messageSchema);
const MessageDeleteFlag = model("messageDeleteFlag", messageDeleteFlagSchema);

export { Messages, MessageDeleteFlag };
