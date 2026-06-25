import { PipelineStage, Types } from "mongoose";

import { IDeleteConversationRequest, IUserBlockRequest } from "@repo/interfaces/conversationInterface.js";
import { ConversationEntry } from "@repo/interfaces/syncRegistryInterface.js";
import mongoose from "mongoose";
import { z } from "zod";
import {
  activityLookup,
  cleanConversation,
  conversationLookup,
  conversationMessagesLookup,
  currentUserReadReceiptLookup,
  groupLookup,
  membersLookup,
  messagesLookup,
  readReceiptLookup,
  starredMessagesLookup,
  userLookup,
} from "../db/stages/stages.js";
import PublicKeyHistory from "../models/PublicKeyHistoryModel.js";
import { IGroupConversation, IUserConversation } from "../interfaces/conversationInterface.js";
import Conversations from "../models/ConversationModel.js";
import Dummy from "../models/Dummy.js";
import GroupConversation from "../models/GroupConversation.js";
import Member from "../models/MemberModel.js";
import UserConversation from "../models/UserConversation.js";
import { conversationBlockRequest, conversationSchema, userConversationsSchema } from "../schemas/conversationSchema";
import { groupConversationsSchema, membersSchema } from "../schemas/groupSchema";
import { readReceiptSchema, readReceiptsSchema } from "../schemas/readReceiptSchema.js";
import MessageReadReceipt from "../models/MessageReadReceipt.js";
import { syncRegistry } from "../lib/SyncRegistry.js";
import { fetchGroupsByUserId } from "./groupServices.js";
import userServices from "./userServices.js";
import {
  SaveConversationSyncState,
  SaveConversationSyncStateFieldValues,
} from "@repo/interfaces/syncRegistryInterface.js";

async function saveConversations({
  conversationBody,
  userConversationsBody,
  participantsCollection,
}: {
  conversationBody: z.infer<typeof conversationSchema>;
  userConversationsBody: z.infer<typeof userConversationsSchema>;
  participantsCollection: z.infer<typeof membersSchema>;
}) {
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const conversation = (await Conversations.create([conversationBody], { session }))[0];

      if (!conversation) throw new Error("Conversation creation failed");

      const userConversations = await UserConversation.insertMany(userConversationsBody, { session });
      const members = await Member.insertMany(participantsCollection, { session });

      conversation.members = members.map((m) => m._id);

      await conversation.save();

      return { conversation, userConversations };
    });

    session.endSession();

    return result;
  } catch (error) {
    session.abortTransaction();
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createConversation(conversation: z.infer<typeof conversationSchema>) {
  try {
    const result = await Conversations.create(conversation);

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createUserConversation(userConversations: z.infer<typeof userConversationsSchema>) {
  try {
    const result = await UserConversation.insertMany(userConversations);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createGroupConversation(
  groupConversations: z.infer<typeof groupConversationsSchema>,
  session?: mongoose.mongo.ClientSession,
) {
  try {
    const ops = groupConversations.map((doc) => ({
      updateOne: {
        filter: { userId: doc.userId, conversationId: doc.conversationId },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    }));

    const result = await GroupConversation.bulkWrite(ops, { ordered: false, session: session ? session : undefined });

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function deleteGroupConversation(userId: Types.ObjectId, conversationId: Types.ObjectId) {
  const session = await mongoose.startSession();
  try {
    const res = await session.withTransaction(async () => {
      const deletedMembers = await Member.deleteMany({ userId, conversationId }, { session });
      const deletedConves = await GroupConversation.deleteOne({ userId, conversationId }, { session });
    });

    await session.endSession();
  } catch (error) {
    session.abortTransaction();
    console.error("Error deleteGroupConversation:", error);
    throw error;
  }
}

async function fetchAllConversations() {
  const res = await Conversations.find();
  return res;
}

async function getUserConversation(userId: Types.ObjectId) {
  try {
    const activeKeyDoc = await PublicKeyHistory.findOne({ userId, status: "active" });
    const activatedAt = activeKeyDoc ? activeKeyDoc.activatedAt : 0;

    const pipeline = [
      {
        $match: { userId },
      },

      ...currentUserReadReceiptLookup(userId),

      ...readReceiptLookup(),

      ...conversationLookup(),

      ...membersLookup(),

      conversationMessagesLookup(userId, undefined, activatedAt),

      starredMessagesLookup(),

      cleanConversation,
    ];

    const res = await UserConversation.aggregate(pipeline);

    return res as IUserConversation[];
  } catch (error) {
    console.log("getUserConversation-------->", error);
    throw error;
  }
}

async function updateUserConversationById(id: Types.ObjectId, updates: Partial<IUserConversation>) {
  try {
    const res = await UserConversation.findOneAndUpdate({ id }, updates);
    return res;
  } catch (error) {
    console.log("updateUserConversationById-------->", error);
  }
}

async function updateGroupConversationById(id: Types.ObjectId, updates: Partial<IGroupConversation>) {
  try {
    const res = await GroupConversation.findOneAndUpdate({ id }, updates);
    return res;
  } catch (error) {
    console.log("updateGroupConversationById-------->", error);
  }
}

async function updateUserConversationBlockStatus({
  conversationId,
  blockedList,
  blocked,
  blockedId,
}: z.infer<typeof conversationBlockRequest>) {
  try {
    if (blocked) {
      const res = await Conversations.findOneAndUpdate(
        { id: conversationId },
        { $push: { blockedList }, $inc: { version: 1 } },
        { new: true },
      );
    } else {
      const res = await Conversations.findOneAndUpdate(
        { id: conversationId },
        { $pull: { blockedList: { userId: blockedId } }, $inc: { version: 1 } },
        { new: true },
      );
    }
  } catch (error) {
    console.log("updateUserConversationBlockStatus-------->", error);
  }
}

async function updateConversationById(id: string, updates: Partial<IUserConversation>) {
  try {
    const res = await Conversations.findOneAndUpdate({ id }, updates);
    return res;
  } catch (error) {
    console.log("updateConversationById-------->", error);
  }
}

async function clearConversation(req: IDeleteConversationRequest) {
  try {
    const res = await Conversations.updateOne(
      { id: req.conversationId, "members.id": req.userId },
      {
        $set: {
          "members.$.deletedForUser": req.deletedForUser,
          "members.$.timeOfDeletion": req.timeOfDeletion,
        },
      },
      { upsert: true },
    );

    return res;
  } catch (error) {
    console.log("clearConversation------->", error);
  }
}

async function unsetConversationDeletion(conversationId: Types.ObjectId) {
  try {
    const res = await Conversations.updateOne(
      { id: conversationId },
      {
        $unset: {
          "members.$[].deletedForUser": "",
        },
      },
      { upsert: true },
    );

    return res;
  } catch (error) {
    console.log("unsetConversationDeletion------->", error);
  }
}

async function addToArchive(id: Types.ObjectId) {
  try {
    const res = await UserConversation.findOneAndUpdate({ id }, { archived: true });

    return res;
  } catch (error) {
    console.log("addToArchive------->", error);
  }
}

async function removeFromArchive(id: Types.ObjectId) {
  try {
    const res = await UserConversation.findOneAndUpdate({ id }, { archived: false });

    return res;
  } catch (error) {
    console.log("removeFromArchive------->", error);
  }
}

async function registerStarredMessages(id: Types.ObjectId, messageId: Types.ObjectId, host: string) {
  try {
    if (host === "user") {
      const res = await UserConversation.findOneAndUpdate({ id }, { $push: { starred: messageId } });
    } else {
      const res = await GroupConversation.findOneAndUpdate({ id }, { $push: { starred: messageId } });
    }
  } catch (error) {
    console.log("registerStarredMessages------->", error);
  }
}

async function unregisterStarredMessages(id: Types.ObjectId, messageId: Types.ObjectId, host: string) {
  try {
    if (host === "user" || host === "group")
      await UserConversation.findOneAndUpdate({ id }, { $pull: { starred: messageId } });
    if (host === "group") await GroupConversation.findOneAndUpdate({ id }, { $pull: { starred: messageId } });
  } catch (error) {
    console.log("unregisterStarredMessages------->", error);
  }
}

const createPipeline = (
  conversationId: string,
  userId: Types.ObjectId,
  host: "user" | "group" | "ai",
  req: any,
  readReceiptEntries?: Types.ObjectId[],
  activatedAt: number = 0,
) => {
  const matchStage = { $match: { userId, conversationId: new Types.ObjectId(conversationId) } };

  if (req.newEntry) {
    if (host === "user")
      return [
        matchStage,
        ...currentUserReadReceiptLookup(userId),
        ...readReceiptLookup(readReceiptEntries),
        ...conversationLookup(),
        ...membersLookup(),
        conversationMessagesLookup(userId, undefined, activatedAt),
        starredMessagesLookup(),
        cleanConversation,
      ];

    if (host === "group")
      return [
        matchStage,
        ...readReceiptLookup(),
        ...groupLookup(),
        ...membersLookup(),
        activityLookup(),
        messagesLookup({ userId }),
        starredMessagesLookup(),
        cleanConversation,
      ];

    if (host === "ai")
      return [
        matchStage,
        // ...currentUserReadReceiptLookup(userId),
        // ...readReceiptLookup(readReceiptEntries),
        ...conversationLookup(),
        ...membersLookup(),
        conversationMessagesLookup(userId, undefined, activatedAt),
        starredMessagesLookup(),
        cleanConversation,
      ];

    return [];
  }

  const pipeline: PipelineStage[] = [matchStage];

  if (host === "group") pipeline.push(activityLookup());

  if (req.needSync) {
    if (host === "group") pipeline.push(...groupLookup(), ...membersLookup(), starredMessagesLookup());
    else if (host === "user") pipeline.push(...conversationLookup(), ...membersLookup(), starredMessagesLookup());
    else pipeline.push(...conversationLookup(), ...membersLookup(), starredMessagesLookup());
  }

  if (req.lastKnownMessageTimestamp) {
    if (host === "group")
      pipeline.push(messagesLookup({ userId, lastKnownMessageTimestamp: req.lastKnownMessageTimestamp }));
    if (host === "user") {
      pipeline.push(...currentUserReadReceiptLookup(userId));
      pipeline.push(conversationMessagesLookup(userId, req.lastKnownMessageTimestamp, activatedAt));
    }
    if (host === "ai") pipeline.push(conversationMessagesLookup(userId, req.lastKnownMessageTimestamp));
  }

  if (req.needSync) {
    pipeline.push(cleanConversation);
    return pipeline;
  }

  if (req.lastKnownMessageTimestamp) {
    pipeline.push({ $project: { messages: 1, host: 1, id: 1, conversationId: 1 } });
    return pipeline;
  }

  return pipeline;
};

async function fetchConversations(userId: Types.ObjectId, conversationEntries: ConversationEntry[]) {
  if (!conversationEntries.length) return [];

  try {
    const activeKeyDoc = await PublicKeyHistory.findOne({ userId, status: "active" });
    const activatedAt = activeKeyDoc ? activeKeyDoc.activatedAt : 0;

    const res: Record<string, PipelineStage[]> = {};
    const resultKeys: Set<string> = new Set();

    for (const req of conversationEntries) {
      const pipeline = {
        $unionWith: {
          coll: req.host === "group" ? "groupconversations" : "userconversations",
          pipeline: createPipeline(req.conversationId!, userId, req?.host!, req, undefined, activatedAt),
        },
      };

      const collection = (() => {
        if (req.newEntry) return "newEntry";
        if (req.needSync) return req.lastKnownMessageTimestamp ? "newEntry" : "needSync";
        if (req.lastKnownMessageTimestamp) return "messages";
        if (req.unSyncUserIds) return "unSyncUserIds";
        return null;
      })();

      if (!collection) continue;

      resultKeys.add(collection);

      if (res[collection]) res[collection].push(pipeline);
      else res[collection] = [{ $match: { _id: { $exists: false } } }, pipeline];
    }

    if (!!Object.keys(res)) {
      const promises: Promise<any>[] = [];

      resultKeys.forEach((collection) => {
        promises.push(Dummy.aggregate(res[collection]));
      });

      const result = await Promise.all(promises);

      const data: Record<string, any> = {};

      Array.from(resultKeys).forEach((collection, i) => {
        data[collection] = result[i];
      });

      return data;
    }
    return null;
  } catch (error) {
    console.log("fetchConversations--->", error);
    throw error;
  }
}

async function saveMessageReadReceipt(readReceipts: z.infer<typeof readReceiptsSchema>) {
  try {
    const ops = readReceipts.map((doc) => ({
      updateOne: {
        filter: { userId: doc.userId, conversationId: doc.conversationId, senderId: doc.senderId },
        update: {
          $max: {
            lastDeliveredMessageTimestamp: doc.lastDeliveredMessageTimestamp,
            lastReadMessageTimestamp: doc.lastReadMessageTimestamp,
          },
          $set: { updatedAt: doc.updatedAt },
        },
        upsert: true,
      },
    }));

    const res = await MessageReadReceipt.bulkWrite(ops);

    if (res.ok) {
      const asd = await syncRegistry.saveReadReceiptEntries(readReceipts);
    }
    return res;
  } catch (error) {
    console.log("saveMessageReadReceipt--->", error);
    throw error;
  }
}

async function doFullSync(userIdParsed: Types.ObjectId, userId: string) {
  try {
    const conversationIds: string[] = [];
    const conversationSyncState: SaveConversationSyncState[] = [];

    const result = await Promise.all([
      getUserConversation(userIdParsed),
      fetchGroupsByUserId(userIdParsed),
      userServices.getUsersFromConversations(userIdParsed),
    ]);

    const userConversations = result[0];
    const groupConversations = result[1];
    const globalUsers = result[2];

    if (!userConversations || !groupConversations || !globalUsers) {
      throw new Error("One or more database baseline queries failed to return data");
    }

    const newConversations = [...userConversations, ...groupConversations];

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

    return {
      unsyncConversationsData: { newEntry: newConversations },
      unsyncUsersData: globalUsers,
      syncToken: Date.now(),
    };
  } catch (error) {
    if (error instanceof mongoose.Error) {
      console.error(`[doFullSync] Database error performing baseline sync for user ${userId}:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error(
        `[doFullSync] Unexpected error performing database baseline synchronization for user ${userId}:`,
        error,
      );
    }
    throw error;
  }
}

async function syncUserConversations(userIdParsed: Types.ObjectId, userId: string, syncToken?: number) {
  try {
    // 1. Sync Token (Vector Clock) Synchronization Path
    if (syncToken !== undefined && Number(syncToken) > 0) {
      const tokenVal = Number(syncToken);
      console.log(`########### running syncToken-based sync for token: ${tokenVal} ###########`);

      const unsyncEntries = await syncRegistry.getUnsyncStateByToken({ userId, syncToken: tokenVal });

      if (unsyncEntries === null) {
        console.log("Registry missing, performing full fallback baseline load");
        return doFullSync(userIdParsed, userId);
      }

      if (unsyncEntries.length === 0) {
        console.log("########### conversations upto date by token ###########");
        const activeConversations = await syncRegistry.getRegisteredConversations(userId);
        const activeConversationObjectIds = activeConversations.map((id) => new Types.ObjectId(id));

        const [globalUsers, unsyncReadReceipts] = await Promise.all([
          userServices.getUsersFromConversations(userIdParsed),
          MessageReadReceipt.find({
            conversationId: { $in: activeConversationObjectIds },
            updatedAt: { $gt: tokenVal },
          }),
        ]);

        const unsyncUsersData: Record<string, any> = {};

        Object.entries(globalUsers).forEach(([k, v]) => {
          if (v && (v as any).updatedAt && (v as any).updatedAt > tokenVal) {
            unsyncUsersData[k] = v;
          }
        });

        return {
          unsyncConversationsData: null,
          unsyncUsersData: Object.keys(unsyncUsersData).length ? unsyncUsersData : null,
          unsyncReadReceipts: unsyncReadReceipts.length ? unsyncReadReceipts : null,
          syncToken: Date.now(),
        };
      }

      console.log("########### fetching recent conversation updates since token ###########");
      const activeConversations = await syncRegistry.getRegisteredConversations(userId);
      const activeConversationObjectIds = activeConversations.map((id) => new Types.ObjectId(id));

      const [unsyncConversationsData, globalUsers, unsyncReadReceipts] = await Promise.all([
        fetchConversations(userIdParsed, unsyncEntries),
        userServices.getUsersFromConversations(userIdParsed),
        MessageReadReceipt.find({
          conversationId: { $in: activeConversationObjectIds },
          updatedAt: { $gt: tokenVal },
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

      return {
        unsyncConversationsData,
        unsyncUsersData: Object.keys(unsyncUsersData).length ? unsyncUsersData : null,
        unsyncReadReceipts: unsyncReadReceipts.length ? unsyncReadReceipts : null,
        syncToken: Date.now(),
      };
    }

    // 2. Fallback Baseline Sync Path
    return doFullSync(userIdParsed, userId);
  } catch (error) {
    if (error instanceof mongoose.Error) {
      console.error(`[syncUserConversations] Database error performing sync for user ${userId}:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error(`[syncUserConversations] Unexpected error performing sync for user ${userId}:`, error);
    }
    throw error;
  }
}

export default {
  saveConversations,
  createConversation,
  createUserConversation,
  createGroupConversation,
  deleteGroupConversation,
  fetchConversations,
  fetchAllConversations,
  getUserConversation,
  updateConversationById,
  updateUserConversationById,
  updateGroupConversationById,
  updateUserConversationBlockStatus,
  clearConversation,
  unsetConversationDeletion,
  addToArchive,
  removeFromArchive,
  registerStarredMessages,
  unregisterStarredMessages,
  saveMessageReadReceipt,
  syncUserConversations,
};
