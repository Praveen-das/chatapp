import { Schema, model } from "mongoose";

export const failedReencryptionSchema = new Schema({
  messageId: { type: Schema.Types.ObjectId, required: true },
  conversationId: { type: Schema.Types.ObjectId, required: true },
  requesterId: { type: Schema.Types.ObjectId, required: true },
  otherPublicKey: { type: String },
  encryptedContent: { type: String, required: true },
  reason: { type: String, required: true },
  resolved: { type: Boolean, default: false },
  timestamp: { type: Number, default: () => Date.now() },
});

failedReencryptionSchema.index({ conversationId: 1, resolved: 1 });
failedReencryptionSchema.index({ requesterId: 1 });

const FailedReencryption = model("failedReencryption", failedReencryptionSchema);

export default FailedReencryption;
