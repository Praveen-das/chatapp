import { Schema, model } from "mongoose";
import { IUserConversation } from "@repo/interfaces/conversationInterface";

const schemaOptions = { toJSON: { virtuals: true } };

const userConversationSchema = new Schema<IUserConversation>(
  {
    id: Schema.Types.ObjectId,
    userId: Schema.Types.ObjectId,
    conversationId: Schema.Types.ObjectId,

    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    starred: [Schema.Types.ObjectId],

    deletedAt:  { type: Number, default: () => Date.now() },
    createdAt:  { type: Number, default: () => Date.now() },
  },
  schemaOptions
);

const UserConversation = model("userConversation", userConversationSchema);

export default UserConversation;
