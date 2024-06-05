import { Schema, model } from "mongoose";

const readReceiptSchema = new Schema({
    userId: String,
    status: Number
})

export const messageSchema = new Schema({
    id: String,
    conversationId: String,
    message: String,
    from: String,
    to: String,
    timestamp: Number,
    readReceipt: [readReceiptSchema],
    deletedFor: [String],
    reply: {
        message: String,
        offsetTop: Number
    },
})

const Messages = model('messages', messageSchema)

export default Messages

