import { Schema, model } from "mongoose";

const schemaOptions = { toJSON: { virtuals: true } }

const ProfileRules = new Schema({ isVisible: { type: Boolean, default: true } })

export const userSchema = new Schema({
    id: Schema.Types.ObjectId,
    username: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    bio: {
        type: String,
        default: '',
    },
    profilePicture: {
        type: String,
        default: '',
    },
    rules: {
        profilePicture: { isVisible: { type: Boolean, default: true } },
        bio: { isVisible: { type: Boolean, default: true } },
        lastSeen: { isVisible: { type: Boolean, default: true } },
        readReceipts: { isVisible: { type: Boolean, default: true } },
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'online',
    },
    tags:[String],
    lastSeen: Number,
    createdAt: Number,
    updatedAt: Number,
}, schemaOptions)

userSchema.index({ username: 1,phoneNumber:1 });

const User = model('user', userSchema)

export default User

