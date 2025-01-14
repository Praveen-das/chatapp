import { Schema, model } from "mongoose";
import { IGroupConversation } from "../interfaces/conversationInterface";

const schemaOptions = { toJSON: { virtuals: true } };

const groupConversationSchema = new Schema<IGroupConversation>(
  {
    id: Schema.Types.ObjectId,
    userId: Schema.Types.ObjectId,
    conversationId: Schema.Types.ObjectId,

    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    starred: [Schema.Types.ObjectId],

    joinedAt: Number,
    deletedAt: Number,
    createdAt: Number,
    updatedAt: Number,
  },
  schemaOptions
);

const GroupConversation = model("groupConversation", groupConversationSchema);

export default GroupConversation;
