import { Schema, model } from "mongoose";
import { syncRegistry } from "../lib/SyncRegistry";
import { IUserConversation } from "../interfaces/conversationInterface";

const conversationSchema = new Schema(
  {
    id: Schema.Types.ObjectId,
    host: String,
    members: [Schema.Types.ObjectId],
    blockedList: [{ userId: Schema.Types.ObjectId, blockedBy: Schema.Types.ObjectId }],
    version: { type: Number, default: 0 },

    createdAt: { type: Number, default: () => Date.now() },
    updatedAt: { type: Number, default: () => Date.now() },
  },
  { toJSON: { virtuals: true } }
);

conversationSchema.index({ id: 1 });

conversationSchema.post("findOneAndUpdate", async (conversation: IUserConversation) => {
  if (!conversation) return null;

  const res = await syncRegistry.saveConversationSyncState([
    { conversationId: conversation.id, fieldValues: ["version", conversation.version!] },
  ]);

  if (!res?.length) return;

  console.log("line:101-->", res);
});

const Conversations = model("conversation", conversationSchema);

export default Conversations;
