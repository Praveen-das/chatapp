import { Schema, model } from "mongoose";
import { IConversation, IUserConversation } from "../interfaces/conversationInterface";

const schemaOptions = { toJSON: { virtuals: true } };

const conversationSchema = new Schema<IConversation>(
  {
    id: Schema.Types.ObjectId,
    host: String,
    members: [Schema.Types.ObjectId],
    createdAt: Number,
    updatedAt: Number,
  },
  schemaOptions
);

conversationSchema.index({id:1})

const Conversations = model("conversation", conversationSchema);

export default Conversations;
