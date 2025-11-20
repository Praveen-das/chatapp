import { Schema, model } from "mongoose";
import { IGroup } from "@repo/interfaces/groupInterface";
import { IGroupConversation } from "../interfaces/conversationInterface";
import { syncRegistry } from "../lib/SyncRegistry";

const schemaOptions = { toJSON: { virtuals: true } };

const groupSchema = new Schema<IGroup>(
  {
    id: Schema.Types.ObjectId,
    channelId: String,
    invitationId: Schema.Types.ObjectId,
    displayName: String,
    profilePicture: String,
    admins: [String],
    tags: [String],
    host: String,
    members: [{ type: Schema.Types.ObjectId, ref: "members" }],
    desc: { type: String, default: "" },
    createdBy: Schema.Types.ObjectId,
    version: { type: Number, default: 0 },

    createdAt: { type: Number, default: () => Date.now() },
    updatedAt: { type: Number, default: () => Date.now() },
  },
  schemaOptions
);

groupSchema.post("findOneAndUpdate", async (conversation: IGroupConversation) => {
  if (!conversation) return null;
  
  const res = await syncRegistry.saveConversationSyncState([
    { conversationId: conversation.id, fieldValues: ["version", conversation.version!] },
  ]);

  if (!res?.length) return;

  console.log("line:38-->", res?.length);
});

const Groups = model("groups", groupSchema);

export default Groups;
