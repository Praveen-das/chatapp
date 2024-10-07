import { Schema, model } from "mongoose";
import { IUserConversation } from "../interfaces/conversationInterface";

const schemaOptions = { toJSON: { virtuals: true } };

export const userSchema = new Schema({
  id: Schema.Types.ObjectId,
  timeOfJoining: Number,
  timeOfDeletion: Number,
  deletedForUser: Boolean,
});

userSchema.index({id:1})

const conversationSchema = new Schema<IUserConversation>(
  {
    id: Schema.Types.ObjectId,
    host: String,
    members: [userSchema],
    createdAt: Number,
    updatedAt: Number,
  },
  schemaOptions
);

conversationSchema.index({id:1})

const Conversations = model("conversation", conversationSchema);

export { Conversations };
