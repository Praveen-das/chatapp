import { PipelineStage, Types } from "mongoose";
import z from "zod";
import { activityLookup, messagedeleteflagsLookup, messagesLookup } from "../db/stages/stages";
import { IMessage } from "../interfaces/messageInterface";
import GroupConversation from "../models/GroupConversation";
import { MessageDeleteFlag, Messages } from "../models/MessageModel";
import client from "../redis/client";
import { systemMessagesSchema } from "../schemas/systemMessageSchema";
import { messagesSchema } from "../schemas/userMessageSchema";
import { LIMIT } from "../../const";

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
    console.log('aaaaaaa->',messages)
    const res = await Messages.insertMany(messages);
    console.log('saveUserMessage------>',res.length)
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

    const pipeline:any = [
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
    ]

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

      messagesLookup({userId, cursor}),

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
};
