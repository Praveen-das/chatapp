import { Types } from "mongoose";
import { LIMIT } from "../../../const";

export const groupLookup = () => [
  {
    $lookup: {
      from: "groups",
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
      displayName: "$conversation.displayName",
      channelId: "$conversation.channelId",
      invitationId: "$conversation.invitationId",
      profilePicture: "$conversation.profilePicture",
      admins: "$conversation.admins",
      desc: "$conversation.desc",
      tags: "$conversation.tags",
      createdBy: "$conversation.createdBy",
      updatedAt: "$conversation.updatedAt",
      version: "$conversation.version",
    },
  },
];

export const conversationLookup = () => [
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
      updatedAt: "$conversation.updatedAt",
      version: "$conversation.version",
      username: "$conversation.username",
      blocked: {
        $cond: [
          {
            $in: ["$userId", { $ifNull: ["$conversation.blockedList.blockedBy", []] }],
          },
          true,
          false,
        ],
      },
      blockedByUser: {
        $cond: [
          {
            $in: ["$userId", { $ifNull: ["$conversation.blockedList.userId", []] }],
          },
          true,
          false,
        ],
      },
    },
  },
];

export const activityLookup = () => ({
  $lookup: {
    from: "members",
    let: {
      cId: "$conversationId",
      uId: "$userId",
    },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: ["$conversationId", "$$cId"],
              },
              {
                $eq: ["$userId", "$$uId"],
              },
            ],
          },
        },
      },
    ],
    as: "activityLog",
  },
});

export const messagesLookup = ({
  userId,
  cursor,
  lastKnownMessageTimestamp,
}: {
  userId: Types.ObjectId;
  cursor?: number;
  lastKnownMessageTimestamp?: number;
}): any => ({
  $lookup: {
    from: "messages",
    let: {
      convoId: "$conversationId",
      activityLog: "$activityLog",
      cursor,
      lastKnownMessageTimestamp,
    },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: ["$conversationId", "$$convoId"],
              },
              {
                $cond: [
                  {
                    $ifNull: ["$$lastKnownMessageTimestamp", false],
                  },
                  {
                    $gt: ["$timestamp", "$$lastKnownMessageTimestamp"],
                  },
                  {
                    $reduce: {
                      input: "$$activityLog",
                      initialValue: false,
                      in: {
                        $or: [
                          "$$value",
                          {
                            $and: [
                              {
                                $gte: ["$timestamp", "$$this.joinedAt"],
                              },
                              {
                                $cond: [
                                  {
                                    $ifNull: ["$$this.exitedAt", false],
                                  },
                                  {
                                    $lt: ["$timestamp", "$$this.exitedAt"],
                                  },
                                  true,
                                ],
                              },
                              {
                                $cond: [
                                  {
                                    $ifNull: ["$$cursor", false],
                                  },
                                  {
                                    $lt: ["$timestamp", "$$cursor"],
                                  },
                                  true,
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },

      {
        $sort: {
          timestamp: -1,
        },
      },
      {
        $limit: LIMIT + 1,
      },

      ...messagedeleteflagsLookup(userId),

      // userLookup({ localField: "from", as: "user" }),

      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $sort: {
          timestamp: 1,
        },
      },
    ],
    as: "messages",
  },
});

export const recentMessagesLookup = (userId: Types.ObjectId, lastKnownMessageTimestamp?: number): any => ({
  $lookup: {
    from: "messages",
    let: {
      convoId: "$conversationId",
      lastKnownMessageTimestamp,
    },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              {
                $eq: ["$conversationId", "$$convoId"],
              },
              {
                $lt: ["$timestamp", "$$lastKnownMessageTimestamp"],
              },
            ],
          },
        },
      },

      {
        $sort: {
          timestamp: -1,
        },
      },
      {
        $limit: LIMIT + 1,
      },

      // userLookup({ localField: "from", as: "user" }),

      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $sort: {
          timestamp: 1,
        },
      },
    ],
    as: "messages",
  },
});

export const membersLookup = () => [
  {
    $lookup: {
      from: "members",
      localField: "members",
      foreignField: "_id",
      as: "members",
    },
  },
];

// export const membersLookup = () => [
//   {
//     $lookup: {
//       from: "members",
//       let: { memberIds: "$members" },
//       pipeline: [
//         {
//           $match: {
//             $expr: {
//               $in: ["$_id", { $ifNull: ["$$memberIds", []] }],
//             },
//           },
//         },
//         ...userLookupPipeline(),
//       ],
//       as: "members",
//     },
//   },
//   { $addFields: { members: "$members.user" } },
// ];

export const userLookupPipeline = () => [
  {
    $lookup: {
      from: "users",
      let: {
        userId: "$userId",
        memberId: "$_id",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$id", "$$userId"],
            },
          },
        },
        {
          $project: {
            id: 1,
            username: 1,
            phoneNumber: 1,
            profilePicture: 1,
            rules: 1,
            bio: 1,
            tags: 1,
          },
        },
        {
          $addFields: {
            memberId: "$$memberId",
          },
        },
      ],
      as: "user",
    },
  },
  {
    $unwind: "$user",
  },
];

export const conversationMessagesLookup = (userId: Types.ObjectId, lastKnownMessageTimestamp?: number): any => ({
  $lookup: {
    from: "messages",
    let: {
      deletedAt: "$deletedAt",
      conversationId: "$conversationId",
      lastKnownMessageTimestamp,
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
                $cond: [
                  {
                    $ifNull: ["$$lastKnownMessageTimestamp", false],
                  },
                  {
                    $gt: ["$timestamp", "$$lastKnownMessageTimestamp"],
                  },
                  {
                    $gt: ["$timestamp", "$$deletedAt"],
                  },
                ],
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

      {
        $sort: {
          timestamp: -1,
        },
      },
      {
        $limit: LIMIT + 1,
      },

      // userLookup({ localField: "from", as: "user" }),

      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Perform the messageDeleted lookup for only the matched messages
      ...messagedeleteflagsLookup(userId),

      {
        $sort: {
          timestamp: 1,
        },
      },
    ],
    as: "messages",
  },
});

export const userLookup = ({ as, localField }: { as: string; localField: string }) => ({
  $lookup: {
    from: "users",
    localField,
    foreignField: "id",
    as,
  },
});

export const messagedeleteflagsLookup = (userId: Types.ObjectId) => [
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
];

export const starredMessagesLookup = () => ({
  $lookup: {
    from: "messages",
    localField: "starred",
    foreignField: "id",
    as: "starred",
  },
});

export const readReceiptLookup = (readReceiptEntries?: Types.ObjectId[]) => [
  {
    $lookup: {
      from: "messagereadreceipts",
      let: {
        userId: "$userId",
        readReceiptEntries,
        conversationId: "$conversationId",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$conversationId", "$$conversationId"] },
                {
                  $cond: [
                    {
                      $ifNull: ["$$readReceiptEntries", false],
                    },
                    { $in: ["$senderId", "$$readReceiptEntries"] },
                    { $eq: ["$senderId", "$$userId"] },
                  ],
                },
              ],
            },
          },
        },
        ...recentReadReceiptForUser(),
      ],
      as: "readReceiptValues",
    },
  },
  ...transformReadReceiptsArray(),
];

export function recentReadReceiptForUser() {
  return [
    {
      $unionWith: {
        coll: "messagereadreceipts",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$conversationId", "$$conversationId"],
                  },
                  {
                    $eq: ["$userId", "$$userId"],
                  },
                ],
              },
            },
          },
          {
            $sort: {
              lastDeliveredMessageTimestamp: -1,
            },
          },
          {
            $limit: 1,
          },
        ],
      },
    },
  ];
}

export function transformReadReceiptsArray() {
  return [
    {
      $addFields: {
        readReceipt: {
          $arrayToObject: {
            $map: {
              input: "$readReceiptValues",
              as: "m",
              in: {
                k: { $toString: "$$m.userId" }, // key
                v: "$$m",
              },
            },
          },
        },
      },
    },
    {
      $project: {
        readReceiptValues: 0,
      },
    },
  ];
}
