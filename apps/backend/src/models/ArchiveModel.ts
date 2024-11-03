import { Schema, model } from "mongoose";

const archiveSchema = new Schema({
    conversationId:Schema.Types.ObjectId,
    userId:Schema.Types.ObjectId,
})

const Archive = model('archive', archiveSchema)

export default Archive

