import { Schema, model } from "mongoose";

const schemaOptions = { toJSON: { virtuals: true } }

const memberSchema = new Schema({
    username: String,
    userId: String,
    isAdmin: Boolean,
}, schemaOptions)

const groupSchema = new Schema({
    id: String,
    host: String,
    members: [String],
    createdAt: Number,
    updatedAt: Number,
    
    channelId: String,
    displayName: String,
    admins: [String],
}, schemaOptions)

const Groups = model('groups', groupSchema)

export default Groups