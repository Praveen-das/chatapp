import mongoose, { Schema, model } from "mongoose";
import { userSchema } from "./UserModal";

const schemaOptions = { toJSON: { virtuals: true } }

const groupSchema = new Schema({
    id: String,
    host: String,
    members: [String],
    desc: {
        type: String,
        default: ''
    },
    createdBy: String,
    createdAt: Number,
    updatedAt: Number,
    invitationId: String,

    channelId: String,
    displayName: String,
    admins: [String],
}, schemaOptions)

const Groups = model('groups', groupSchema)

export default Groups