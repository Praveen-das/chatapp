import mongoose, { Schema, model } from "mongoose";

const readReceiptSchema = new Schema({
    userId: String,
    status: Number
})

const imageAttachmentSchema = new mongoose.Schema<IImageAttachment>({
    id: String,
    type: String,
    url: String,
    thumbnail: String,
})

const urlAttachmentSchema = new Schema<IUrlAttachment>({
    id: String,
    type: String,
    host: String,
    url: String,
    metadata: {
        title: String,
        description: String,
        image: String,
        error: Number,
    }
})

const urlAttachmentModal = model('urlAttachmentModal', urlAttachmentSchema)

const imageAttachmentModal = model('imageAttachmentModal', imageAttachmentSchema)

// const attachmentSchema = new Schema({
//     type: Schema.Types.Mixed as unknown as IAttachment,
//     validate: {
//         validator: function (this, v: any) {
//             if (!v) return true
//             if (v.type === 'images') return urlAttachmentModal.validate(v);
//             if (v.type === 'link') return imageAttachmentModal.validate(v);
//             return false;
//         },
//     },
// })


function validator(_: any, v: any) {
    if (!v) return true
    if (v.type === 'images') return urlAttachmentModal.validate(v);
    if (v.type === 'link') return imageAttachmentModal.validate(v);
    return false;
}

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
        validate: { validator },
    },
    readReceipt: [readReceiptSchema],
    deletedFor: [String],
    reply: {
        message: String,
        username: String,
        attachment: {
            type: Schema.Types.Mixed as unknown as IAttachment,
            validate: { validator },
        },
        offsetTop: Number
    },
})

const Messages = model('messages', messageSchema)

export default Messages

