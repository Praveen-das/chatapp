import { Schema, model } from "mongoose";

export const memberSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt:  { type: Number, default: () => Date.now() },
  exitedAt:  { type: Number, default: () => Date.now() },
});

memberSchema.index({ conversationId: 1, userId: 1 });

const Member = model("members", memberSchema);

export default Member;
