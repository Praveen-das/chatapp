import { Schema, model } from "mongoose";
import id from "zod/v4/locales/id.js";

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
        enum: ["hide_profilepicture", "hide_bio", "hide_lastseen", "hide_readreceipts"],
      },
    ],
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
    tags: [String],
    lastSeen: Number,
    createdAt: Number,
    updatedAt: Number,
  },
  schemaOptions
);

userSchema.index({ id: 1,username: 1, phoneNumber: 1 });

const User = model("user", userSchema);

export default User;
