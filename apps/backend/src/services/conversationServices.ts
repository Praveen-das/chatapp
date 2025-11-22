import { PipelineStage, Types } from "mongoose";

import { IDeleteConversationRequest, IUserBlockRequest } from "@repo/interfaces/conversationInterface.js";
import { ConversationEntry } from "@repo/interfaces/syncRegistryInterface.js";
import mongoose from "mongoose";
import { z } from "zod";
import {
  activityLookup,
  conversationLookup,
  conversationMessagesLookup,
  groupLookup,
  membersLookup,
  messagedeleteflagsLookup,
  messagesLookup,
  readReceiptLookup,
  starredMessagesLookup,
  userLookup,
} from "../db/stages/stages.js";
import { IGroupConversation, IUserConversation } from "../interfaces/conversationInterface.js";
import Conversations from "../models/ConversationModel.js";
import Dummy from "../models/Dummy.js";
import GroupConversation from "../models/GroupConversation.js";
import Member from "../models/MemberModel.js";
import SystemConversation from "../models/SystemConversation.js";
import UserConversation from "../models/UserConversation.js";
import {
  conversationBlockRequest,
  conversationSchema,
  systemConversationSchema,
  userConversationsSchema,
} from "../schemas/conversationSchema";
import { groupConversationsSchema, membersSchema } from "../schemas/groupSchema";
import { readReceiptSchema, readReceiptsSchema } from "../schemas/readReceiptSchema.js";
import MessageReadReceipt from "../models/MessageReadReceipt.js";
import { syncRegistry } from "../lib/SyncRegistry.js";

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

async function createSystemConversation(conversation: z.infer<typeof systemConversationSchema>) {
  try {
    const result = await SystemConversation.create(conversation);

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createUserConversation(userConversations: z.infer<typeof userConversationsSchema>) {
  try {
    const result = await UserConversation.insertMany(userConversations);

    // return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createGroupConversation(
  groupConversations: z.infer<typeof groupConversationsSchema>,
  session?: mongoose.mongo.ClientSession
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
    const pipeline = [
      {
        $match: { userId },
      },

      ...readReceiptLookup(),

      ...conversationLookup(),

      ...membersLookup(),

      conversationMessagesLookup(userId),

      starredMessagesLookup(),
    ];

    const res = await UserConversation.aggregate(pipeline);

    console.log("tUserConversation------>", res?.length);

    return res as IUserConversation[];
  } catch (error) {
    console.log("getUserConversation-------->", error);
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
        { new: true }
      );
    } else {
      const res = await Conversations.findOneAndUpdate(
        { id: conversationId },
        { $pull: { blockedList: { userId: blockedId } }, $inc: { version: 1 } },
        { new: true }
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
      { upsert: true }
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
      { upsert: true }
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
    if (host === "user") await UserConversation.findOneAndUpdate({ id }, { $pull: { starred: messageId } });
    if (host === "group") await GroupConversation.findOneAndUpdate({ id }, { $pull: { starred: messageId } });
    if (host === "system") await SystemConversation.findOneAndUpdate({ id }, { $pull: { starred: messageId } });
  } catch (error) {
    console.log("unregisterStarredMessages------->", error);
  }
}

const createPipeline = (
  conversationId: string,
  userId: Types.ObjectId,
  host: "user" | "group",
  req: any,
  readReceiptEntries?: Types.ObjectId[]
) => {
  const matchStage = { $match: { userId, conversationId: new Types.ObjectId(conversationId) } };

  if (req.newEntry) {
    if (host === "user")
      return [
        matchStage,
        ...readReceiptLookup(readReceiptEntries),
        ...conversationLookup(),
        ...membersLookup(),
        conversationMessagesLookup(userId),
        starredMessagesLookup(),
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
        { $project: { conversation: 0, activityLog: 0 } },
      ];

    return [];
  }

  const pipeline: PipelineStage[] = [matchStage];

  if (host === "group") pipeline.push(activityLookup());

  if (req.needSync) {
    if (host === "group")
      pipeline.push(...groupLookup(), ...membersLookup(), starredMessagesLookup());
    if (host === "user")
      pipeline.push(
        ...conversationLookup(),
        userLookup({ localField: "members", as: "members" }),
        starredMessagesLookup()
      );
  }

  if (req.lastKnownMessageTimestamp) {
    if (host === "group")
      pipeline.push(messagesLookup({ userId, lastKnownMessageTimestamp: req.lastKnownMessageTimestamp }));
    if (host === "user") pipeline.push(conversationMessagesLookup(userId, req.lastKnownMessageTimestamp));
  }

  if (req.needSync) {
    pipeline.push({
      $project: {
        conversation: 0,
        activityLog: 0,
      },
    });
    return pipeline;
  }

  if (req.lastKnownMessageTimestamp) {
    pipeline.push({ $project: { messages: 1, id: 1, conversationId: 1 } });
    return pipeline;
  }

  return pipeline;
};

async function fetchConversations(
  userId: Types.ObjectId,
  conversationEntries: ConversationEntry[],
) {
  if (!conversationEntries.length) return [];

  try {
    const res: Record<string, PipelineStage[]> = {};
    const resultKeys: Set<string> = new Set();

    for (const req of conversationEntries) {
      const pipeline = {
        $unionWith: {
          coll: req.host === "group" ? "groupconversations" : "userconversations",
          pipeline: createPipeline(
            req.conversationId!,
            userId,
            req?.host!,
            req,
          ),
        },
      };

      const collection = (() => {
        switch (Object.keys(req)[0]) {
          case "newEntry":
            return "newEntry";
          case "needSync":
            return req.lastKnownMessageTimestamp ? "newEntry" : "needSync";
          case "lastKnownMessageTimestamp":
            return "messages";
          case "unSyncUserIds":
            return "unSyncUserIds";
          default:
            return null;
        }
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
    return [];
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
        },
        upsert: true,
      },
    }));

    const res = await MessageReadReceipt.bulkWrite(ops);

    if (res.ok) {
      syncRegistry.saveReadReceiptEntries(readReceipts);
    }
    return res;
  } catch (error) {
    console.log("saveMessageReadReceipt--->", error);
    throw error;
  }
}

export default {
  saveConversations,
  createConversation,
  createSystemConversation,
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
};
