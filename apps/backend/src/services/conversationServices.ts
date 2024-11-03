import { Types } from "mongoose";

import Conversations from "../models/ConversationModel.js";
import {
  IUserConversation,
  IDeleteConversationRequest,
} from "../interfaces/conversationInterface.js";
import Archive from "../models/ArchiveModel.js";

async function createConversation(conversation: IUserConversation) {
  try {
    let members = conversation.members.map((m) => ({
      ...m,
      id: new Types.ObjectId(m.id),
    }));
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

// [
//   {
//     $match: {
//       "members.id": userId,
//     },
//   },

//   {
//     $addFields: {
//       deletedUsers: {
//         $let: {
//           vars: {
//             matchedMember: {
//               $filter: {
//                 input: "$members",
//                 as: "member",
//                 cond: {
//                   $eq: ["$$member.deletedForUser", true],
//                 },
//               },
//             },
//           },
//           in: "$$matchedMember.id",
//         },
//       },
//     },
//   },

//   {
//     $lookup: {
//       from: "messages",
//       localField: "id",
//       foreignField: "conversationId",
//       let: {
//         timeOfJoining: "$userStatus.timeOfJoining",
//         timeOfDeletion: "$userStatus.timeOfDeletion",
//       },
//       pipeline: [
//         {
//           $lookup: {
//             from: "messagedeleteflags",
//             let: { messageId: "$id", userId },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       {
//                         $eq: ["$messageId", "$$messageId"],
//                       },
//                       {
//                         $eq: ["$userId", "$$userId"],
//                       },
//                     ],
//                   },
//                 },
//               },
//             ],
//             as: "messageDeleted",
//           },
//         },
//         {
//           $unwind: {
//             path: "$messageDeleted",
//             preserveNullAndEmptyArrays: true,
//           },
//         },
//         {
//           $match: {
//             $or: [
//               {
//                 to: { $exists: true },
//               },
//               {
//                 from: userId,
//               },
//             ],
//             $expr: {
//               $and: [
//                 {
//                   $ne: ["$messageDeleted.deleted", true],
//                 },
//                 {
//                   $gte: ["$timestamp", "$$timeOfJoining"],
//                 },
//                 {
//                   $gt: ["$timestamp", "$$timeOfDeletion"],
//                 },
//               ],
//             },
//           },
//         },
//       ],
//       as: "messages",
//     },
//   },

//   {
//     $lookup: {
//       from: "users",
//       localField: "members.id",
//       foreignField: "id",
//       as: "members",
//     },
//   },
// ]

async function getUserConversation(userIdString: string) {
  try {
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
            $arrayElemAt: [
              {
                $filter: {
                  input: "$members",
                  as: "member",
                  cond: {
                    $eq: ["$$member.id", userId],
                  },
                },
              },
              0,
            ],
          },
          deletedUsers: {
            $let: {
              vars: {
                matchedMember: {
                  $filter: {
                    input: "$members",
                    as: "member",
                    cond: {
                      $eq: ["$$member.deletedForUser", true],
                    },
                  },
                },
              },
              in: "$$matchedMember.id",
            },
          },
        },
      },
      {
        $lookup: {
          from: "messages",
          let: {
            timeOfDeletion: "$userStatus.timeOfDeletion",
            conversationId: "$id",
          },
          pipeline: [
            // Match messages based on conversationId and timestamps in one step
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$conversationId", "$$conversationId"] },
                    {
                      $or: [
                        { $gt: ["$timestamp", "$$timeOfDeletion"] },
                        { $eq: ["$$timeOfDeletion", null] },
                      ],
                    },
                    {
                      $or: [
                        { $ne: [{ $ifNull: ["$to", null] }, null] },
                        { $eq: ["$from", userId] },
                      ],
                    },
                  ],
                },
              },
            },
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
                          { $eq: ["$messageId", "$$messageId"] },
                          { $eq: ["$userId", "$$userId"] },
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
                $expr: { $ne: ["$messageDeleted.deleted", true] },
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

      {
        $lookup: {
          from: "archives",
          let: { conversationId: "$id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$conversationId", "$$conversationId"],
                    },
                    { $eq: ["$userId", userId] },
                  ],
                },
              },
            },
          ],
          as: "isArchived",
        },
      },

      {
        $addFields: {
          isArchived: {
            $cond: {
              if: { $gt: [{ $size: "$isArchived" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },

      {
        $project: {
          userStatus: 0,
        },
      },
    ]);

    return res;
  } catch (error) {
    console.log("getUserConversation-------->", error);
  }
}

async function updateConversationById(
  id: string,
  updates: Partial<IUserConversation>
) {
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

async function addToArchive(
  conversationId: Types.ObjectId,
  userId: Types.ObjectId
) {
  try {
    const res = await Archive.create({ conversationId, userId });

    return res;
  } catch (error) {
    console.log("addToArchive------->", error);
  }
}

async function removeFromArchive(
  conversationId: Types.ObjectId,
  userId: Types.ObjectId
) {
  try {
    const res = await Archive.findOneAndDelete({ conversationId, userId });

    return res;
  } catch (error) {
    console.log("removeFromArchive------->", error);
  }
}

export default {
  createConversation,
  fetchAllConversations,
  getUserConversation,
  updateConversationById,
  clearConversation,
  unsetConversationDeletion,
  addToArchive,
  removeFromArchive,
};
