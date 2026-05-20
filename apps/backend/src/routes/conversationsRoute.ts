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
import * as groupServices from "../services/groupServices";
import userServices from "../services/userServices";
import messageServices from "../services/messageServices";
import conversationController from "../controller/conversationController";
import MessageReadReceipt from "../models/MessageReadReceipt";
import { Types } from "mongoose";

const router = Router();

async function doFullSync(userIdParsed: Types.ObjectId, userId: string, res: any) {
  const conversationIds: string[] = [];
  const conversationSyncState: SaveConversationSyncState[] = [];

  const result = await Promise.all([
    conversationServices.getUserConversation(userIdParsed),
    groupServices.fetchGroupsByUserId(userIdParsed),
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
      "createdAt",
      c.createdAt || Date.now(),
      "updatedAt",
      c.updatedAt || Date.now(),
    ];

    messageTimestamp && conversationSyncStateValues.push("messageTimestamp", messageTimestamp);

    conversationIds.push(conversationId);
    conversationSyncState.push({ conversationId, fieldValues: conversationSyncStateValues });
  });

  await Promise.all([
    syncRegistry.registerConversations(userId, conversationIds),
    syncRegistry.saveConversationSyncState(conversationSyncState),
  ]);

  return res.json({
    unsyncConversationsData: { newEntry: newConversations },
    unsyncUsersData: globalUsers,
    syncToken: Date.now()
  });
}

router.post(
  "/:userId",
  async (
    req: Request<
      any,
      any,
      {
        idbConvRecord?: IIdbConversastionRecord;
        idbMembersRecord?: IIdbUserRecordValue[];
        idbReadReceiptRecord?: IdbReadReceiptRecord;
        syncToken?: number;
      }
    >,
    res
  ) => {
    try {
      const userId = req.params.userId;

      if (!req.body) return res.json({ error: new Error("Body not found") });
      if (!userId) return res.json("userId not provided");

      const { idbConvRecord, idbMembersRecord, idbReadReceiptRecord, syncToken } = req.body;
      const userIdParsed = objectId.parse(userId);

      // 1. Sync Token (Vector Clock) Synchronization Path
      if (syncToken !== undefined && Number(syncToken) > 0) {
        const tokenVal = Number(syncToken);
        console.log(`########### running syncToken-based sync for token: ${tokenVal} ###########`);

        const unsyncEntries = await syncRegistry.getUnsyncStateByToken({ userId, syncToken: tokenVal });

        if (unsyncEntries === null) {
          console.log("Registry missing, performing full fallback baseline load");
          return doFullSync(userIdParsed, userId, res);
        }

        if (!unsyncEntries.length) {
          console.log("########### conversations upto date by token ###########");
          const activeConversations = await syncRegistry.getRegisteredConversations(userId);
          const activeConversationObjectIds = activeConversations.map(id => new Types.ObjectId(id));

          const [globalUsers, unsyncReadReceipts] = await Promise.all([
            userServices.getUsersFromConversations(userIdParsed),
            MessageReadReceipt.find({
              conversationId: { $in: activeConversationObjectIds },
              updatedAt: { $gt: tokenVal }
            })
          ]);

          const unsyncUsersData: Record<string, any> = {};
          Object.entries(globalUsers).forEach(([k, v]) => {
            if (v && (v as any).updatedAt && (v as any).updatedAt > tokenVal) {
              unsyncUsersData[k] = v;
            }
          });

          if (!Object.keys(unsyncUsersData).length && !unsyncReadReceipts.length) {
            return res.json({ unsyncConversationsData: null, unsyncUsersData: null, unsyncReadReceipts: null, syncToken: Date.now() });
          }

          return res.json({
            unsyncConversationsData: null,
            unsyncUsersData: Object.keys(unsyncUsersData).length ? unsyncUsersData : null,
            unsyncReadReceipts: unsyncReadReceipts.length ? unsyncReadReceipts : null,
            syncToken: Date.now()
          });
        }

        console.log("########### fetching recent conversation updates since token ###########");
        const activeConversations = await syncRegistry.getRegisteredConversations(userId);
        const activeConversationObjectIds = activeConversations.map(id => new Types.ObjectId(id));

        const [unsyncConversationsData, globalUsers, unsyncReadReceipts] = await Promise.all([
          conversationServices.fetchConversations(userIdParsed, unsyncEntries),
          userServices.getUsersFromConversations(userIdParsed),
          MessageReadReceipt.find({
            conversationId: { $in: activeConversationObjectIds },
            updatedAt: { $gt: tokenVal }
          }),
        ]);

        const unsyncUsersData: Record<string, any> = {};
        Object.entries(globalUsers).forEach(([k, v]) => {
          if (v && (v as any).updatedAt && (v as any).updatedAt > tokenVal) {
            unsyncUsersData[k] = v;
          }
        });

        console.log("unsyncConversationsData (token)----->", Object.keys(unsyncConversationsData || {}).length);
        console.log("unsyncUsersData (token)----->", Object.keys(unsyncUsersData || {}).length);
        console.log("unsyncReadReceipts (token)----->", unsyncReadReceipts.length);

        return res.json({
          unsyncConversationsData,
          unsyncUsersData: Object.keys(unsyncUsersData).length ? unsyncUsersData : null,
          unsyncReadReceipts: unsyncReadReceipts.length ? unsyncReadReceipts : null,
          syncToken: Date.now()
        });
      }

      // 2. Fallback Baseline / Differential Sync Path
      if (!idbConvRecord || !idbMembersRecord || !idbReadReceiptRecord) {
        return doFullSync(userIdParsed, userId, res);
      }

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
        return doFullSync(userIdParsed, userId, res);
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

      return res.json({ unsyncConversationsData, unsyncUsersData, unsyncReadReceipts, syncToken: Date.now() });
    } catch (error) {
      console.log("Error in fetching user conversations", error);
      res.send(error);
    }
  }
);

export default router;
