import {
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

const router = Router();

router.post(
  "/:userId",
  async (
    req: Request<any, any, { idbConvRecord: IIdbConversastionRecord; idbMembersRecord: IIdbUserRecordValue[] }>,
    res
  ) => {
    try {
      const userId = req.params.userId;
      if (!req.body) return res.json({ error: new Error("Body not found") });

      const { idbConvRecord, idbMembersRecord } = req.body;

      if (!userId) return res.json("userId not provided");

      const userIdParsed = objectId.parse(userId);
      const [unsyncEntries, unsyncUsers] = await Promise.all([
        syncRegistry.getUnsyncState({ userId, idbConvRecord }),
        syncRegistry.getUnsyncUsers(idbMembersRecord),
      ]);

      if (unsyncEntries === null || !Object.keys(idbConvRecord).length) {
        console.log("########### fetching conversations ###########");
        const conversationIds: string[] = [];
        const conversationSyncState: SaveConversationSyncState[] = [];

        const newConversations = (
          await Promise.all([conversationServices.getUserConversation(userIdParsed), fetchGroupsByUserId(userIdParsed)])
        ).flat();

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

        return res.json({ newEntry: newConversations });
      }

      if (!unsyncEntries.length) {
        console.log("########### conversations upto date ###########");
        return res.json(null);
      }

      console.log("unsyncEntries----->", unsyncEntries.length);
      console.log("########### fetching recent conversation updates ###########");
      const [unsyncConversationsData, unsyncUsersData] = await Promise.all([
        conversationServices.fetchConversations(userIdParsed, unsyncEntries),
        !!unsyncUsers.length ? userServices.fetchUnsyncUsers(unsyncUsers) : Promise.resolve(null),
      ]);

      return res.json({ unsyncConversationsData, unsyncUsersData });
    } catch (error) {
      console.log("Error in fetching user conversations", error);
      res.send(error);
    }
  }
);

export default router;
