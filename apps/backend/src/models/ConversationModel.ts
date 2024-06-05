import { Schema, model, SchemaTypes } from "mongoose";
// import { messageSchema } from "./MessageModel";

const schemaOptions = { toJSON: { virtuals: true } }

// const messageSchema = new Schema({
//     type: SchemaTypes.ObjectId,
//     ref: 'messages'
// })

const conversationSchema = new Schema({
    id: String,
    host: String,
    members: [String],
    createdAt: Number,
    updatedAt: Number,
    // deletedFor: [String],
    // recentMessage: messageSchema,
}, schemaOptions)

const Conversations = model('conversation', conversationSchema)

export default Conversations

