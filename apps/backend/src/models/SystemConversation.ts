import { Schema, model } from "mongoose";
import { ISystemConversation } from "@repo/interfaces/conversationInterface";

const systemConversationSchema = new Schema<ISystemConversation>(
  {
    id: Schema.Types.ObjectId,
    host: String,
    userId: Schema.Types.ObjectId,
    conversationId: Schema.Types.ObjectId,

    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    starred: [Schema.Types.ObjectId],

    createdAt: Number,
    updatedAt: Number,
  }
);

const SystemConversation  = model("systemConversation", systemConversationSchema);

export default SystemConversation ;
