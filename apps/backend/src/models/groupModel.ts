import mongoose, { Schema, model } from "mongoose";
import { userSchema } from "./ConversationModel";

const schemaOptions = { toJSON: { virtuals: true } };

const groupSchema = new Schema(
  {
    id: Schema.Types.ObjectId,
    host: String,
    members: [userSchema],
    desc: {
      type: String,
      default: "",
    },
    createdBy: Schema.Types.ObjectId,
    createdAt: Number,
    updatedAt: Number,
    invitationId: Schema.Types.ObjectId,

    channelId: String,
    displayName: String,
    profilePicture: String,
    admins: [Schema.Types.ObjectId],
  },
  schemaOptions
);

const Groups = model("groups", groupSchema);

export default Groups;
