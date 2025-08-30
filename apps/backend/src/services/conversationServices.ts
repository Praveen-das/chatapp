import { Types } from "mongoose";

import Conversations from "../models/ConversationModel.js";
import { IUserConversation, IConversation, IGroupConversation } from "../interfaces/conversationInterface.js";
import { IUpdateBlockReq, IDeleteConversationRequest } from "@repo/interfaces/conversationInterface.js";
import UserConversation from "../models/UserConversation.js";
import GroupConversation from "../models/GroupConversation.js";
import { z } from "zod";
import { conversationSchema, systemConversationSchema, userConversationsSchema } from "../schemas/conversationSchema";
import { groupConversationsSchema } from "../schemas/groupSchema";
import SystemConversation from "../models/SystemConversation.js";

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

async function createGroupConversation(groupConversations: z.infer<typeof groupConversationsSchema>) {
  try {
    const result = await GroupConversation.insertMany(groupConversations);

    // return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function deleteGroupConversation(id: Types.ObjectId) {
  try {
    const res = await GroupConversation.deleteOne({ id });
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

async function fetchAllConversations() {
  const res = await Conversations.find();
  return res;
}

async function getUserConversation(userId: Types.ObjectId) {
  try {
    const res = await UserConversation.aggregate([
      {
        $match: { userId },
      },
      {
        $lookup: {
          from: "conversations",
          localField: "conversationId",
          foreignField: "id",
          as: "conversation",
        },
      },
      {
        $unwind: {
          path: "$conversation",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          members: "$conversation.members",
          host: "$conversation.host",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "id",
          as: "members",
        },
      },

      // messages
      {
        $lookup: {
          from: "messages",
          let: {
            deletedAt: "$deletedAt",
            conversationId: "$conversationId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$conversationId", "$$conversationId"],
                    },
                    {
                      $gt: ["$timestamp", "$$deletedAt"],
                    },
                    {
                      $or: [
                        {
                          $ne: [
                            {
                              $ifNull: ["$to", null],
                            },
                            null,
                          ],
                        },
                        {
                          $eq: ["$from", userId],
                        },
                      ],
                    },
                  ],
                },
              },
            },

            { $sort: { timestamp: -1 } },
            {
              $limit: 10,
            },
            { $sort: { timestamp: 1 } },

            // Perform the messageDeleted lookup for only the matched messages
            {
              $lookup: {
                from: "messagedeleteflags",
                let: {
                  messageId: "$id",
                  userId,
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ["$messageId", "$$messageId"],
                          },
                          {
                            $eq: ["$userId", "$$userId"],
                          },
                        ],
                      },
                    },
                  },
                ],
                as: "messageDeleted",
              },
            },
            // Unwind messageDeleted with preservation
            {
              $unwind: {
                path: "$messageDeleted",
                preserveNullAndEmptyArrays: true,
              },
            },
            // Filter out deleted messages
            {
              $match: {
                $expr: {
                  $ne: ["$messageDeleted.deleted", true],
                },
              },
            },
          ],
          as: "messages",
        },
      },

      // starred messages
      {
        $lookup: {
          from: "messages",
          localField: "starred",
          foreignField: "id",
          as: "starred",
        },
      },
      {
        $project: {
          conversation: 0,
        },
      },
    ]);

    return res;
  } catch (error) {
    console.log("getUserConversation-------->", error);
  }
}

async function updateUserConversationById(id: Types.ObjectId, updates: Partial<IUserConversation>) {
  try {
    const res = await UserConversation.findOneAndUpdate({ id }, updates);
    return res;
  } catch (error) {
    console.log("updateConversationById-------->", error);
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

async function updateUserConversationBlockStatus({ conversationId, userId, requestedUserId, value }: IUpdateBlockReq) {
  try {
    const res = await UserConversation.bulkWrite([
      {
        updateOne: {
          filter: { conversationId, userId },
          update: { $set: { blockedByUser: value } },
        },
      },
      {
        updateOne: {
          filter: { conversationId, userId: requestedUserId },
          update: { $set: { blocked: value } },
        },
      },
    ]);
    return res;
  } catch (error) {
    console.log("updateConversationById-------->", error);
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
  console.log({ id });

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

async function registerStarredMessages(id: Types.ObjectId, messageIds: Types.ObjectId[], host: string) {
  try {
    if (host === "user") {
      const res = await UserConversation.findOneAndUpdate({ id }, { $push: { starred: messageIds } });
    } else {
      const res = await GroupConversation.findOneAndUpdate({ id }, { $push: { starred: messageIds } });
    }
  } catch (error) {
    console.log("registerStarredMessages------->", error);
  }
}

async function unregisterStarredMessages(id: Types.ObjectId, messageId: Types.ObjectId, host: string) {
  try {
    if (host === "user") {
      const res = await UserConversation.findOneAndUpdate({ id }, { $pull: { starred: messageId } });
    } else {
      const res = await GroupConversation.findOneAndUpdate({ id }, { $pull: { starred: messageId } });
    }
  } catch (error) {
    console.log("unregisterStarredMessages------->", error);
  }
}

export default {
  createConversation,
  createSystemConversation,
  createUserConversation,
  createGroupConversation,
  deleteGroupConversation,
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
};
