import { Schema, model } from "mongoose";
import { IUserConversation } from "../interfaces/conversationInterface";
import { memberSchema } from "./schemas/memberSchema";

const schemaOptions = { toJSON: { virtuals: true } };

memberSchema.index({id:1})

const conversationSchema = new Schema<IUserConversation>(
  {
    id: Schema.Types.ObjectId,
    host: String,
    members: [memberSchema],
    createdAt: Number,
    updatedAt: Number,
  },
  schemaOptions
);

conversationSchema.index({id:1})

const Conversations = model("conversation", conversationSchema);

export default Conversations;
