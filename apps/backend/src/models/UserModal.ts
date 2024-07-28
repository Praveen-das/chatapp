import { Schema, model } from "mongoose";

const schemaOptions = { toJSON: { virtuals: true } }

const ProfileRules = new Schema({ isVisible: { type: Boolean, default: true } })

const rulesSchema = new Schema({
    profilePicture: ProfileRules,
    bio: ProfileRules,
    lastSeen: ProfileRules,
    readReceipts: ProfileRules,
})

export const userSchema = new Schema({
    id: String,
    username: {
        type: String,
        required: true
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
        type: rulesSchema,
        default: {
            profilePicture: { isVisible: true },
            bio: { isVisible: true },
            lastSeen: { isVisible: true },
            readReceipts: { isVisible: true },
        }
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'online',
    },
    lastSeen: Number,
    createdAt: Number,
    updatedAt: Number,
}, schemaOptions)

const User = model('user', userSchema)

export default User

