import { Schema, Types, model } from "mongoose";

export const pendingReencryptRequestSchema = new Schema({
  requesterId: { type: Schema.Types.ObjectId, required: true },
  targetUserId: { type: Schema.Types.ObjectId, required: true },
  conversationId: { type: Schema.Types.ObjectId, required: true },
  requesterPublicKey: { type: String, required: true },
  messageIds: [{ type: Schema.Types.ObjectId, required: true }],
  timestamp: { type: Number, default: () => Date.now() },
});

// Compound index for querying a user's pending requests and unique check
pendingReencryptRequestSchema.index({ targetUserId: 1 });
pendingReencryptRequestSchema.index({ requesterId: 1, targetUserId: 1, conversationId: 1 }, { unique: true });

const PendingReencryptRequest = model("pendingReencryptRequest", pendingReencryptRequestSchema);

export default PendingReencryptRequest;
