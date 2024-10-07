import { Types } from "mongoose";

import { Conversations } from "../models/ConversationModel.js";
import {
  IUserConversation,
  IDeleteConversationRequest,
} from "../interfaces/conversationInterface.js";

async function createConversation(conversation: IUserConversation) {
  let members = conversation.members.map((m) => ({
    ...m,
    id: new Types.ObjectId(m.id),
  }));

  try {
    const result = await Conversations.create({ ...conversation, members });

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function fetchAllConversations() {
  const res = await Conversations.find();
  return res;
}

async function getUserConversation(userIdString: string) {
  const userId = new Types.ObjectId(userIdString);

  const res = await Conversations.aggregate([
    {
      $match: {
        "members.id": userId,
      },
    },

    {
      $addFields: {
        userStatus: {
          $filter: {
            input: "$members",
            as: "member",
            cond: {
              $eq: ["$$member.id", userId],
            },
          },
        },
      },
    },
    {
      $unwind: {
        path: "$userStatus",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        deletedForUser: "$userStatus.deletedForUser",
      },
    },

    {
      $lookup: {
        from: "messages",
        let: {
          timeOfJoining: "$userStatus.timeOfJoining",
          deletedForUser: "$userStatus.deletedForUser",
          timeOfDeletion: "$userStatus.timeOfDeletion",
        },
        localField: "id",
        foreignField: "conversationId",
        pipeline: [
          {
            $lookup: {
              from: "messagedeleteflags",
              let: { messageId: "$id", userId },
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
          {
            $unwind: {
              path: "$messageDeleted",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              $or:[
                {
                  to: { $exists: true }
                },
                {
                  from: userId
                },
              ],
              $expr: {
                $and: [
                  {
                    $ne: ["$messageDeleted.deleted", true],
                  },
                  {
                    $gte: ["$timestamp", "$$timeOfJoining"],
                  },
                  {
                    $gt: ["$timestamp", "$$timeOfDeletion"],
                  },
                ],
              },
            },
          },
        ],
        as: "messages",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "members.id",
        foreignField: "id",
        as: "members",
      },
    },
  ]);

  return res;
}

async function updateConversationById(
  id: string,
  updates: Partial<IUserConversation>
) {
  const res = await Conversations.findOneAndUpdate({ id }, updates);
  return res;
}

async function clearConversation(req: IDeleteConversationRequest) {
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

  console.log(res);

  return res;
}

export default {
  createConversation,
  fetchAllConversations,
  getUserConversation,
  updateConversationById,
  clearConversation,
};
