import { Schema, model } from "mongoose";
import { IUserConversation } from "../interfaces/conversationInterface";

const schemaOptions = { toJSON: { virtuals: true } };

const userConversationSchema = new Schema<IUserConversation>(
  {
    id: Schema.Types.ObjectId,
    userId: Schema.Types.ObjectId,
    conversationId: Schema.Types.ObjectId,

    active: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    starred: [Schema.Types.ObjectId],
    blocked: { type: Boolean, default: false },
    blockedByUser: { type: Boolean, default: false },

    deletedAt: Number,
    createdAt: Number,
    updatedAt: Number,
  },
  schemaOptions
);

const UserConversation = model("userConversation", userConversationSchema);

export default UserConversation;
