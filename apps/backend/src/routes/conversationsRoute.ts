import {
  IdbReadReceiptRecord,
  IIdbConversastionRecord,
  IIdbUserRecord,
  IIdbUserRecordValue,
  SaveConversationSyncState,
  SaveConversationSyncStateFieldValues,
} from "@repo/interfaces/syncRegistryInterface";
import { Request, Router } from "express";
import { syncRegistry } from "../lib/SyncRegistry";
import { objectId } from "../schemas/objectId";
import conversationServices from "../services/conversationServices";
import { fetchGroupsByUserId } from "../services/groupServices";
import userServices from "../services/userServices";
import messageServices from "../services/messageServices";

const router = Router();

router.post(
  "/:userId",
  async (
    req: Request<
      any,
      any,
      {
        idbConvRecord: IIdbConversastionRecord;
        idbMembersRecord: IIdbUserRecordValue[];
        idbReadReceiptRecord: IdbReadReceiptRecord;
      }
    >,
    res
  ) => {
    try {
      const userId = req.params.userId;

      if (!req.body) return res.json({ error: new Error("Body not found") });
      if (!userId) return res.json("userId not provided");

      const { idbConvRecord, idbMembersRecord, idbReadReceiptRecord } = req.body;
      const userIdParsed = objectId.parse(userId);

      const [unsyncEntries, unsyncUsers, readReceiptEntries] = await Promise.all([
        syncRegistry.getUnsyncState({ userId, idbConvRecord }),
        syncRegistry.getUnsyncUsers(idbMembersRecord),
        syncRegistry.getSyncReadReceiptEntries(userId, idbReadReceiptRecord),
      ]);

      console.log("unsyncEntries----->", unsyncEntries?.length);
      console.log("unsyncUsers----->", unsyncUsers.length);
      console.log("readReceiptRecord----->", readReceiptEntries);

      if (unsyncEntries === null || !Object.keys(idbConvRecord).length) {
        console.log("########### fetching conversations ###########");
        const conversationIds: string[] = [];
        const conversationSyncState: SaveConversationSyncState[] = [];

        const result = await Promise.all([
          conversationServices.getUserConversation(userIdParsed),
          fetchGroupsByUserId(userIdParsed),
          userServices.getUsersFromConversations(userIdParsed),
        ]);

        const newConversations = [...(result[0] || []), ...(result[1] || [])];
        const globalUsers = result[2];

        newConversations.forEach((c) => {
          if (!c) return;
          let conversationId = c.conversationId.toHexString();
          let messageTimestamp = c.messages?.at(-1)?.timestamp;
          let version = c.version;

          let conversationSyncStateValues: SaveConversationSyncStateFieldValues = [
            "conversationId",
            conversationId,
            "version",
            version,
            "host",
            c.host,
          ];

          messageTimestamp && conversationSyncStateValues.push("messageTimestamp", messageTimestamp);

          conversationIds.push(conversationId);
          conversationSyncState.push({ conversationId, fieldValues: conversationSyncStateValues });
        });

        await Promise.all([
          syncRegistry.registerConversations(userId, conversationIds),
          syncRegistry.saveConversationSyncState(conversationSyncState),
        ]);

        console.log("newConversations---->", newConversations.length);
        console.log("globalUsers---->", Object.keys(globalUsers).length);

        return res.json({ unsyncConversationsData: { newEntry: newConversations }, unsyncUsersData: globalUsers });
      }

      if (!unsyncEntries.length && !unsyncUsers.length && !readReceiptEntries.length) {
        console.log("########### conversations upto date ###########");
        return res.json(null);
      }

      console.log("########### fetching recent conversation updates ###########");

      const [unsyncConversationsData, unsyncUsersData, unsyncReadReceipts] = await Promise.all([
        conversationServices.fetchConversations(userIdParsed, unsyncEntries),
        userServices.fetchUnsyncUsers(unsyncUsers),
        messageServices.getReadReceipts(readReceiptEntries),
      ]);

      console.log("unsyncConversationsData----->", Object.keys(unsyncConversationsData || {}).length);
      console.log("unsyncUsersData----->", Object.keys(unsyncUsersData || {}).length);
      console.log("unsyncReadReceipts----->", unsyncReadReceipts.length);

      return res.json({ unsyncConversationsData, unsyncUsersData, unsyncReadReceipts });
    } catch (error) {
      console.log("Error in fetching user conversations", error);
      res.send(error);
    }
  }
);

export default router;
