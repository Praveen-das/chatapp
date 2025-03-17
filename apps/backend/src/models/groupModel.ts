import { Schema, model } from "mongoose";
import { IGroup } from "../interfaces/groupInterface";

const schemaOptions = { toJSON: { virtuals: true } };

const groupSchema = new Schema<IGroup>(
  {
    id: Schema.Types.ObjectId,
    channelId: String,
    invitationId: Schema.Types.ObjectId,
    displayName: String,
    profilePicture: String,
    admins: [String],
    tags: [String],
    host: String,
    members: [Schema.Types.ObjectId],
    desc: { type: String, default: "" },
    createdBy: Schema.Types.ObjectId,
    createdAt: Number,
    updatedAt: Number,
  },
  schemaOptions
);

const Groups = model("groups", groupSchema);

export default Groups;
