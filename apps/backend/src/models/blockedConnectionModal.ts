import { Schema, Types,model } from "mongoose";

const blockedUsersSchema = new Schema({
    id:Types.ObjectId,
    userId:{
        type:Types.ObjectId,
        ref:'user'
    },
    blockedId:{
        type:Types.ObjectId,
        ref:'user'
    },
    createtAt: Number
})

const BlockedUsersModel = model('blockedUsersSchema',blockedUsersSchema)

export default BlockedUsersModel