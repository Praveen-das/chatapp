import mongoose, { Schema, model } from "mongoose";

const readReceiptSchema = new Schema({
    userId: String,
    status: Number
})

// const attachmentSchema = new Schema({ type: { type: String, required: true, enum: ['image', 'url'] } })

const imageAttachmentSchema = new mongoose.Schema<IImageAttachment>({
    id: String,
    type: String,
    url: String,
    thumbnail: String,
})

const urlAttachmentSchema = new Schema<IUrlAttachment>({
    id: String,
    type: String,
    title: String,
    url: String,
    host: String,
    description: String,
    image: String,
})

const urlAttachmentModal = model('urlAttachmentModal', urlAttachmentSchema)

const imageAttachmentModal = model('imageAttachmentModal', imageAttachmentSchema)

export const messageSchema = new Schema<IMessage>({
    id: String,
    conversationId: String,
    message: String,
    from: String,
    to: String,
    host: String,
    timestamp: Number,
    attachment: {
        type: Schema.Types.Mixed as unknown as IAttachment,
        validate: {
            validator: function (this, v: any) {
                if(!v) return true
                if (v.type === 'images') return urlAttachmentModal.validate(v);
                if (v.type === 'link') return imageAttachmentModal.validate(v);
                return false;
            },
        },
    },
    readReceipt: [readReceiptSchema],
    deletedFor: [String],
    reply: {
        message: String,
        offsetTop: Number
    },
})

const Messages = model('messages', messageSchema)

export default Messages

