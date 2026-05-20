import { Schema, model } from "mongoose";
import id from "zod/v4/locales/id.js";
import { syncRegistry } from "../lib/SyncRegistry";

const schemaOptions = { toJSON: { virtuals: true } };

export const userSchema = new Schema(
  {
    id: Schema.Types.ObjectId,
    username: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    rules: [
      {
        type: String,
        enum: [
          "hide_profilepicture",
          "hide_bio",
          "hide_lastseen",
          "hide_readreceipts",
          "disable_chat_assist",
          "disable_content_awareness",
        ],
      },
    ],
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
    tags: [String],
    lastSeen: { type: Number, default: () => Date.now() },
    createdAt: { type: Number, default: () => Date.now() },
    updatedAt: { type: Number, default: () => Date.now() },
    version: { type: Number, default: 0 },
    publicKey: { type: String, default: "" },
    encryptedPrivateKey: { type: String, default: "" },
  },
  schemaOptions
);

userSchema.index({ id: 1, username: 1, phoneNumber: 1 });

userSchema.post("findOneAndUpdate", function (doc) {
  console.log(doc.id);
  syncRegistry.saveUserVersion(doc.id, doc.version);
});

const User = model("user", userSchema);

export default User;
