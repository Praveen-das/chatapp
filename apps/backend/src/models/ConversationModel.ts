import { Schema, model, SchemaTypes } from "mongoose";
import { userSchema } from "./UserModal";

const schemaOptions = { toJSON: { virtuals: true } }

const conversationSchema = new Schema({
    id: String,
    host: String,
    members: [userSchema],
    createdAt: Number,
    updatedAt: Number,
    // deletedFor: [String],
    // recentMessage: messageSchema,
}, schemaOptions)

const Conversations = model('conversation', conversationSchema)

export default Conversations

