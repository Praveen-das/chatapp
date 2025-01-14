import { Types } from "mongoose";

import Conversations from "../models/ConversationModel.js";
import {
  IUserConversation,
  IDeleteConversationRequest,
  IConversation,
  IUpdateBlockReq,
  IGroupConversation,
} from "../interfaces/conversationInterface.js";
import Archive from "../models/ArchiveModel.js";
import UserConversation from "../models/UserConversation.js";
import GroupConversation from "../models/GroupConversation.js";

async function createConversation(conversation: IConversation) {
  try {
    const result = await Conversations.create(conversation);

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createUserConversation(userConversations: IUserConversation[]) {
  try {
    const result = await UserConversation.insertMany(userConversations);

    // return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createGroupConversation(groupConversations: IGroupConversation[]) {
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

// async function getUserConversation(userIdString: string) {
//   try {
//     const userId = new Types.ObjectId(userIdString);

//     const res = await Conversations.aggregate([
//       {
//         $match: {
//           "members.id": userId,
//         },
//       },
//       {
//         $addFields: {
//           userStatus: {
//             $arrayElemAt: [
//               {
//                 $filter: {
//                   input: "$members",
//                   as: "member",
//                   cond: {
//                     $eq: ["$$member.id", userId],
//                   },
//                 },
//               },
//               0,
//             ],
//           },
//           deletedUsers: {
//             $let: {
//               vars: {
//                 matchedMember: {
//                   $filter: {
//                     input: "$members",
//                     as: "member",
//                     cond: {
//                       $eq: ["$$member.deletedForUser", true],
//                     },
//                   },
//                 },
//               },
//               in: "$$matchedMember.id",
//             },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "messages",
//           let: {
//             timeOfDeletion: "$userStatus.timeOfDeletion",
//             conversationId: "$id",
//           },
//           pipeline: [
//             // Match messages based on conversationId and timestamps in one step
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$conversationId", "$$conversationId"] },
//                     {
//                       $or: [
//                         { $gt: ["$timestamp", "$$timeOfDeletion"] },
//                         { $eq: ["$$timeOfDeletion", null] },
//                       ],
//                     },
//                     {
//                       $or: [
//                         { $ne: [{ $ifNull: ["$to", null] }, null] },
//                         { $eq: ["$from", userId] },
//                       ],
//                     },
//                   ],
//                 },
//               },
//             },
//             // Perform the messageDeleted lookup for only the matched messages
//             {
//               $lookup: {
//                 from: "messagedeleteflags",
//                 let: {
//                   messageId: "$id",
//                   userId,
//                 },
//                 pipeline: [
//                   {
//                     $match: {
//                       $expr: {
//                         $and: [
//                           { $eq: ["$messageId", "$$messageId"] },
//                           { $eq: ["$userId", "$$userId"] },
//                         ],
//                       },
//                     },
//                   },
//                 ],
//                 as: "messageDeleted",
//               },
//             },
//             // Unwind messageDeleted with preservation
//             {
//               $unwind: {
//                 path: "$messageDeleted",
//                 preserveNullAndEmptyArrays: true,
//               },
//             },
//             // Filter out deleted messages
//             {
//               $match: {
//                 $expr: { $ne: ["$messageDeleted.deleted", true] },
//               },
//             },
//           ],
//           as: "messages",
//         },
//       },

//       {
//         $lookup: {
//           from: "users",
//           localField: "members.id",
//           foreignField: "id",
//           as: "members",
//         },
//       },

//       {
//         $lookup: {
//           from: "archives",
//           let: { conversationId: "$id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     {
//                       $eq: ["$conversationId", "$$conversationId"],
//                     },
//                     { $eq: ["$userId", userId] },
//                   ],
//                 },
//               },
//             },
//           ],
//           as: "isArchived",
//         },
//       },

//       {
//         $addFields: {
//           isArchived: {
//             $cond: {
//               if: { $gt: [{ $size: "$isArchived" }, 0] },
//               then: true,
//               else: false,
//             },
//           },
//         },
//       },

//       {
//         $project: {
//           userStatus: 0,
//         },
//       },
//     ]);

//     return res;
//   } catch (error) {
//     console.log("getUserConversation-------->", error);
//   }
// }

async function getUserConversation(userIdString: string) {
  try {
    const userId = new Types.ObjectId(userIdString);

    const res = await UserConversation.aggregate([
      {
        $match: {
          userId: userId,
        },
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

      {
        $lookup: {
          from: "messages",
          let: {
            deletedAt: "$deletedAt",
            conversationId: "$conversationId",
          },
          pipeline: [
            // Match messages based on conversationId and timestamps in one step
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
      {
        $lookup:{
          from:'messages',
          localField:'starred',
          foreignField:'id',
          as:'starred'
        }
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

async function updateUserConversationById(
  id: Types.ObjectId,
  updates: Partial<IUserConversation>
) {
  try {
    const res = await UserConversation.findOneAndUpdate({ id }, updates);
    return res;
  } catch (error) {
    console.log("updateConversationById-------->", error);
  }
}

async function updateGroupConversationById(
  id: Types.ObjectId,
  updates: Partial<IGroupConversation>
) {
  try {
    const res = await GroupConversation.findOneAndUpdate({ id }, updates);
    return res;
  } catch (error) {
    console.log("updateGroupConversationById-------->", error);
  }
}

async function updateUserConversationBlockStatus({
  conversationId,
  userId,
  requestedUserId,
  value,
}: IUpdateBlockReq) {
  console.log({
    conversationId,
    userId,
    requestedUserId,
    value,
  });
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

async function addToArchive(id: Types.ObjectId) {
  console.log({ id });

  try {
    const res = await UserConversation.findOneAndUpdate(
      { id },
      { archived: true }
    );

    return res;
  } catch (error) {
    console.log("addToArchive------->", error);
  }
}

async function removeFromArchive(id: Types.ObjectId) {
  try {
    const res = await UserConversation.findOneAndUpdate(
      { id },
      { archived: false }
    );

    return res;
  } catch (error) {
    console.log("removeFromArchive------->", error);
  }
}

async function registerStarredMessages(id: Types.ObjectId,messageIds:Types.ObjectId[],host:string) {
  try {
    if(host === 'user'){
      const res = await UserConversation.findOneAndUpdate(
        { id },
        { $push:{starred:messageIds} }
      );
    }else{
      const res = await GroupConversation.findOneAndUpdate(
        { id },
        { $push:{starred:messageIds} }
      );
    }
  } catch (error) {
    console.log("removeFromArchive------->", error);
  }
}

async function unregisterStarredMessages(id: Types.ObjectId,messageId:Types.ObjectId,host:string) {
  try {
    if(host === 'user'){
      const res = await UserConversation.findOneAndUpdate(
        { id },
        { $pull:{starred:messageId} }
      );
    }else{
      const res = await GroupConversation.findOneAndUpdate(
        { id },
        { $pull:{starred:messageId} }
      );
    }
  } catch (error) {
    console.log("removeFromArchive------->", error);
  }
}

export default {
  createConversation,
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
