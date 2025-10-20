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

export const messagesLookup = (userId: Types.ObjectId, cursor?: number): any => ({
  $lookup: {
    from: "messages",
    let: {
      convoId: "$conversationId",
      activityLog: "$activityLog",
      cursor,
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
        },
      },

      ...messagedeleteflagsLookup(userId),

      userLookup({ localField: "from", as: "user" }),
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      ...limitMessages(),
    ],
    as: "messages",
  },
});

export const membersLookup = () => [
  {
    $lookup: {
      from: "members",
      let: { memberIds: "$members" },
      pipeline: [
        {
          $match: {
            $expr: {
              $in: ["$_id", "$$memberIds"],
            },
          },
        },
        ...userLookupPipeline()
      ],
      as: "members",
    },
  },
  { $addFields: { members: "$members.user" } },
];

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

export const conversationMessagesLookup = (userId: Types.ObjectId) => ({
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

      userLookup({ localField: "from", as: "user" }),
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Perform the messageDeleted lookup for only the matched messages
      ...messagedeleteflagsLookup(userId),

      ...limitMessages(),
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

export const limitMessages = (): Array<any> => [
  {
    $sort: {
      timestamp: -1,
    },
  },
  {
    $limit: LIMIT + 1,
  },
  {
    $sort: {
      timestamp: 1,
    },
  },
];
