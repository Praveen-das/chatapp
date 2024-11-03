import { Schema } from "mongoose";


export const memberSchema = new Schema({
  id: Schema.Types.ObjectId,
  timeOfDeletion: Number,
  deletedForUser: Boolean,
});
