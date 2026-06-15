import { PipelineStage, Types } from "mongoose";
import z from "zod";
import { activityLookup, messagedeleteflagsLookup, messagesLookup } from "../db/stages/stages";
import { IMessage } from "../interfaces/messageInterface";
import GroupConversation from "../models/GroupConversation";
import { MessageDeleteFlag, Messages } from "../models/MessageModel";
import PendingReencryptRequest from "../models/PendingReencryptRequest";
import FailedReencryption from "../models/FailedReencryption";
import client from "../redis/client";
import { systemMessagesSchema } from "../schemas/systemMessageSchema";
import { messagesSchema } from "../schemas/userMessageSchema";
import { LIMIT } from "../../const";
import { syncRegistry } from "../lib/SyncRegistry";
import MessageReadReceipt from "../models/MessageReadReceipt";
import { MessageReadReceipt as IMessageReadReceipt } from "@repo/interfaces/messageInterface";
import { IdbReadReceiptRecord } from "@repo/interfaces/syncRegistryInterface";

async function generateMockMessages(messages: z.infer<typeof messagesSchema>) {
  try {
    const res = await Messages.insertMany(messages);
    return res;
  } catch (error) {
    console.log("saveUserMessage error----->", error);
  }
}

async function saveUserMessage(messages: z.infer<typeof messagesSchema>) {
  try {
    const res = await Messages.insertMany(messages);
    console.log("saveUserMessage------>", res.length);
    return res;
  } catch (error) {
    console.log("saveUserMessage error----->", error);
  }
}

async function saveSystemMessage(messages: z.infer<typeof systemMessagesSchema>) {
  try {
    const res = await Messages.insertMany(messages);
    await client.del("messages_cache");
    return res;
  } catch (error) {
    console.log("saveUserMessage error----->", error);
  }
}

async function getMessages() {
  try {
    return await Messages.find();
  } catch (error) {
    console.log(error);
  }
}

async function getUserMessages({
  conversationId,
  limit = LIMIT,
  userId,
  cursor,
  deletedAt,
}: {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  limit: number;
  deletedAt: number;
  cursor?: number;
}) {
  try {
    const query: PipelineStage.Match["$match"] = {
      conversationId,
      timestamp: {
        $gte: deletedAt,
      },
    };

    if (cursor) {
      query.timestamp.$lt = cursor;
    }

    const pipeline: any = [
      {
        $match: query,
      },

      {
        $sort: {
          timestamp: -1,
        },
      },
      {
        $limit: limit + 1,
      },

      ...messagedeleteflagsLookup(userId),

      {
        $sort: {
          timestamp: -1,
        },
      },
    ];

    const res = await Messages.aggregate(pipeline);

    return res;
  } catch (error) {
    console.log("getUserMessages---->", error);
    return [];
  }
}

async function getGroupMessages({
  conversationId,
  userId,
  cursor,
}: {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  cursor: number;
}) {
  try {
    const groups = await GroupConversation.aggregate([
      { $match: { conversationId, userId } },

      activityLookup(),

      messagesLookup({ userId, cursor }),

      { $project: { messages: 1 } },
    ]);

    return groups[0].messages;
  } catch (error) {
    console.log("getUserMessages---->", error);
    return [];
  }
}

async function deleteUserMessages(messagesId: string[]) {
  try {
    const res = await Messages.deleteMany({ id: { $in: messagesId } });
  } catch (error) {
    console.log("deleteUserMessages---->", error);
  }
}

const updateUserMessages = async (updates: Partial<IMessage>[]) => {
  try {
    var bulkOps: BulkOperation[] = [];

    updates.forEach((update) => {
      let { id, ...items } = update;
      let messageId = new Types.ObjectId(id);
      let userId = new Types.ObjectId(items.readReceipt?.[0]?.userId);
      let updateObj;

      if (!!items.readReceipt?.length) {
        updateObj = {
          $set: {
            "readReceipt.$[element].status": items.readReceipt[0]?.status,
          },
        };

        bulkOps.push({
          updateOne: {
            filter: { id: messageId },
            update: updateObj,
            arrayFilters: [{ "element.userId": userId }],
          },
        });
      } else {
        updateObj = { $set: items };
        bulkOps.push({
          updateOne: {
            filter: { id: messageId },
            update: updateObj,
          },
        });
      }
    });
    const res = await Messages.bulkWrite(bulkOps);
  } catch (error) {
    console.log(error);
  }
};

const deleteMessagesForUser = async (collections: { userId: string; messageId: string }[]) => {
  try {
    var bulkOps: BulkOperation[] = [];

    collections.forEach(({ userId, messageId }) => {
      let collection = {
        messageId: new Types.ObjectId(messageId),
        userId: new Types.ObjectId(userId),
      };

      bulkOps.push({
        updateOne: {
          filter: collection,
          update: { ...collection, deleted: true },
          upsert: true,
        },
      });
    });
    const res = await MessageDeleteFlag.bulkWrite(bulkOps);
  } catch (error) {
    console.log("MessageDeleteFlag.bulkWrite error------->", error);
  }
};

const getReadReceipts = async (
  readReceiptEntries: Awaited<ReturnType<typeof syncRegistry.getSyncReadReceiptEntries>>,
) => {
  if (readReceiptEntries.length === 0) return [];

  const receipts = await MessageReadReceipt.aggregate([
    {
      $match: {
        $or: readReceiptEntries.map((item) => {
          const query: any = {
            senderId: item.userId,
            conversationId: item.conversationId,
          };

          if (item.ids && item.ids.length > 0) {
            query.userId = { $in: item.ids };
          }

          return query;
        }),
      },
    },
  ]);

  if (receipts) {
    syncRegistry.saveReadReceiptEntries(receipts);
    return receipts;
  }

  return [];
};

const savePendingReencryptRequest = async (req: {
  requesterId: string;
  targetUserId: string;
  conversationId: string;
  requesterPublicKey: string;
  messageIds: string[];
}) => {
  try {
    await PendingReencryptRequest.updateOne(
      {
        requesterId: new Types.ObjectId(req.requesterId),
        targetUserId: new Types.ObjectId(req.targetUserId),
        conversationId: new Types.ObjectId(req.conversationId),
      },
      {
        $set: {
          requesterPublicKey: req.requesterPublicKey,
          timestamp: Date.now(),
        },
        $addToSet: {
          messageIds: { $each: req.messageIds.map((id) => new Types.ObjectId(id)) },
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.log("savePendingReencryptRequest error---->", error);
  }
};

const getPendingReencryptRequests = async (targetUserId: string) => {
  try {
    return await PendingReencryptRequest.find({
      targetUserId: new Types.ObjectId(targetUserId),
    });
  } catch (error) {
    console.log("getPendingReencryptRequests error---->", error);
    return [];
  }
};

const resolvePendingReencryptRequest = async (req: {
  requesterId: string;
  targetUserId: string;
  conversationId: string;
}) => {
  try {
    await PendingReencryptRequest.deleteOne({
      requesterId: new Types.ObjectId(req.requesterId),
      targetUserId: new Types.ObjectId(req.targetUserId),
      conversationId: new Types.ObjectId(req.conversationId),
    });
  } catch (error) {
    console.log("resolvePendingReencryptRequest error---->", error);
  }
};

const getMessagesByIds = async (messageIds: string[]) => {
  try {
    return await Messages.find({
      id: { $in: messageIds.map((id) => new Types.ObjectId(id)) },
    });
  } catch (error) {
    console.log("getMessagesByIds error---->", error);
    return [];
  }
};

const saveFailedReencryptions = async (
  failures: {
    messageId: string;
    conversationId: string;
    requesterId: string;
    otherPublicKey?: string;
    encryptedContent: string;
    reason: string;
  }[],
) => {
  try {
    const docs = failures.map((f) => ({
      messageId: new Types.ObjectId(f.messageId),
      conversationId: new Types.ObjectId(f.conversationId),
      requesterId: new Types.ObjectId(f.requesterId),
      otherPublicKey: f.otherPublicKey,
      encryptedContent: f.encryptedContent,
      reason: f.reason,
      timestamp: Date.now(),
    }));

    await FailedReencryption.insertMany(docs);
  } catch (error) {
    console.log("saveFailedReencryptions error---->", error);
  }
};

export default {
  generateMockMessages,
  getMessages,
  getUserMessages,
  getGroupMessages,
  saveUserMessage,
  saveSystemMessage,
  updateUserMessages,
  deleteUserMessages,
  deleteMessagesForUser,
  getReadReceipts,
  savePendingReencryptRequest,
  getPendingReencryptRequests,
  resolvePendingReencryptRequest,
  getMessagesByIds,
  saveFailedReencryptions,
};
