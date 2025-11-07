import { SaveConversationSyncState } from "@repo/interfaces/syncRegistryInterface";
import { syncRegistry } from "../../lib/SyncRegistry";
import { Types } from "mongoose";
import { toString } from "../../lib/helper";

export type HandleUpdatingGroupConversationSyncStateProps = {
  id: string | Types.ObjectId;
  conversationId: string | Types.ObjectId;
  version?: number;
};

export async function handleUpdatingGroupConversationSyncState(
  conversations: HandleUpdatingGroupConversationSyncStateProps[]
) {
  const conversationSyncState: SaveConversationSyncState[] = [];

  conversations.forEach((c) => {
    conversationSyncState.push({
      conversationId: toString(c.id),
      fieldValues: ["conversationId", toString(c.conversationId), "version", c.version!],
    });
  });

  syncRegistry.saveConversationSyncState(conversationSyncState);
}
