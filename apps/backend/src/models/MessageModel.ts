import { Schema, model } from "mongoose";

const readReceiptSchema = new Schema({
    userId: String,
    status: Number
})

const imageAttachmentSchema = new Schema({
    id: String,
    userId: String,
    url: String,
    thumbnail: String,
})

const attachmentSchema = new Schema({
    type: String,
    data: imageAttachmentSchema
})


export const messageSchema = new Schema({
    id: String,
    conversationId: String,
    message: String,
    from: String,
    to: String,
    host: String,
    timestamp: Number,
    attachment: attachmentSchema,
    readReceipt: [readReceiptSchema],
    deletedFor: [String],
    reply: {
        message: String,
        offsetTop: Number
    },
})

const Messages = model('messages', messageSchema)

export default Messages

