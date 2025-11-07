import { Schema, model } from "mongoose";
import { IGroupConversation } from "@repo/interfaces/conversationInterface";

const schemaOptions = { toJSON: { virtuals: true } };

const groupConversationSchema = new Schema<IGroupConversation>(
  {
    id: Schema.Types.ObjectId,
    userId: Schema.Types.ObjectId,
    conversationId: Schema.Types.ObjectId,

    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    starred: [Schema.Types.ObjectId],

    createdAt:  { type: Number, default: () => Date.now() },
  },
  schemaOptions
);

const GroupConversation = model("groupConversation", groupConversationSchema);

export default GroupConversation;
