import { Schema, model } from "mongoose";

const schemaOptions = { toJSON: { virtuals: true } };

const publicKeyHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "user" },
    publicKey: { type: String, required: true },
    activatedAt: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "archived", "revoked"],
      default: "active",
    },
  },
  schemaOptions
);

publicKeyHistorySchema.index({ userId: 1, activatedAt: -1 });

const PublicKeyHistory = model("publicKeyHistory", publicKeyHistorySchema);

export default PublicKeyHistory;
