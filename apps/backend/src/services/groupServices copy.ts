import { Types, startSession } from "mongoose";
import { IGroup } from "@repo/interfaces/groupInterface";
import Group from "../models/groupModel";
import GroupConversation from "../models/GroupConversation";
import { IDeleteConversationRequest } from "@repo/interfaces/conversationInterface";
import { z } from "zod";
import { groupSchema } from "../schemas/groupSchema";
import { LIMIT } from "../../const";
import Member from "../models/MemberModel";

// createGroup
async function createGroup({ members, ...data }: z.infer<typeof groupSchema>) {
  try {
    const session = await startSession();

    const res = await session.withTransaction(async () => {
      const group = await Group.create([data], { session });

      if (!group[0] || group.length === 0) {
        throw new Error("Group creation failed");
      }

      const createdMembers = await Member.insertMany(members, { session });

      group[0].members = createdMembers.map((m) => m._id);

      return await group[0].save({ session });
    });

    await session.endSession();

    return res;
  } catch (error) {
    console.log("createGroup----------------->", error);
    // throw error;
  }
}

// generate InvitationId
async function generateGroupInvitationId(groupId: string) {
  try {
    const invitationId = new Types.ObjectId();
    const id = new Types.ObjectId(groupId);

    await Group.findOneAndUpdate({ id }, { invitationId });

    const populatedGroup = await Group.aggregate([
      {
        $match: { id },
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

    return populatedGroup[0];
  } catch (error) {
    console.log("createGroup--->", error);
    throw error;
  }
}

// fetchGroupsForUser
async function fetchGroupById(groupId: string) {
  try {
    const id = new Types.ObjectId(groupId);
    const groups = await Group.aggregate([
      {
        $match: { invitationId: id },
      },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "id",
          as: "members",
        },
      },
    ]);

    return groups;
  } catch (error) {
    console.log("fetchGroupsByUserId--->", error);
  }
}

async function fetchGroupsByUserId(userId: Types.ObjectId) {
  try {
    const groups = await GroupConversation.aggregate([
      {
        $match: { userId },
      },
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
          displayName: "$conversation.displayName",
          channelId: "$conversation.channelId",
          invitationId: "$conversation.invitationId",
          profilePicture: "$conversation.profilePicture",
          admins: "$conversation.admins",
          host: "$conversation.host",
          desc: "$conversation.desc",
          tags: "$conversation.tags",
          createdBy: "$conversation.createdBy",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members.userId",
          foreignField: "userId",
          as: "members",
        },
      },
      {
        $lookup: {
          from: "messages",
          // let: {
          //   deletedAt: "$deletedAt",
          //   joinedAt: "$joinedAt",
          //   conversationId: "$conversationId",
          // },
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
                      $gte: ["$timestamp", "$$joinedAt"],
                    },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "from",
                foreignField: "id",
                as: "user",
              },
            },
            {
              $unwind: {
                path: "$user",
                preserveNullAndEmptyArrays: true,
              },
            },
            { $sort: { timestamp: -1 } },
            {
              $limit: LIMIT,
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

    return groups;
  } catch (error) {
    console.log("fetchGroupsByUserId--->", error);
  }
}

// fetchAllGroups
async function fetchGroups() {
  try {
    const groups = await Group.aggregate([
      {
        $addFields: {
          id: { $toString: "$_id" },
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "id",
          foreignField: "to",
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

    return groups;
  } catch (error) {
    console.log("fetchGroupsByUserId--->", error);
  }
}

// updateGroupMemberRole
async function updateGroupMemberRole(_groupId: string, _userId: string, isAdmin: boolean) {
  try {
    const groupId = new Types.ObjectId(_groupId);
    const userId = new Types.ObjectId(_userId);
    const updatedGroup = await Group.findOneAndUpdate(
      { id: groupId, "members.userId": userId },
      { $set: { "members.$.isAdmin": isAdmin } },
      { new: true }
    );

    return updatedGroup;
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

async function addMembersToGroup(conversationId: Types.ObjectId, members: Types.ObjectId[]) {
  try {
    const updatedGroup = await Group.findOneAndUpdate(
      { id: conversationId },
      {
        $push: { members },
      },
      { new: true }
    );

    return await Group.aggregate([
      {
        $match: { id: conversationId },
      },
      {
        $lookup: {
          from: "users",
          localField: "members.id",
          foreignField: "id",
          as: "members",
        },
      },
      // {
      //   $lookup: {
      //     from: "messages",
      //     let: { id: "$id" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $eq: ["$conversationId", "$$id"],
      //           },
      //         },
      //       },
      //     ],
      //     as: "messages",
      //   },
      // },
    ]);
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

// removeMemberFromGroup
async function removeMemberFromGroup(conversationId: Types.ObjectId, userId: Types.ObjectId) {
  try {
    const res = await Promise.all([
      Group.findOneAndUpdate(
        { id: conversationId },
        {
          $pull: { members: userId, admins: userId },
        },
        { new: true }
      ),
      GroupConversation.findOneAndUpdate({ conversationId, userId }, { deletedAt: Date.now() }, { new: true }),
    ]);
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

// updateGroup
async function updateGroup(conversationId: Types.ObjectId, updates: Partial<IGroup>) {
  try {
    const updatedGroup = await Group.findOneAndUpdate({ id: conversationId }, updates, { new: true });

    return await Group.aggregate([
      {
        $match: { id: conversationId },
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
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

// deleteGroup
async function deleteGroup(_groupId: string) {
  try {
    const groupId = new Types.ObjectId(_groupId);
    const updatedGroup = await Group.findByIdAndDelete(groupId);

    return updatedGroup;
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

// make user as admin
async function makeUserAdmin(conversationId: Types.ObjectId, userId: Types.ObjectId) {
  try {
    const updatedGroup = await Group.findOneAndUpdate(
      { id: conversationId },
      {
        $push: { admins: userId },
      },
      { new: true }
    );

    return await Group.aggregate([
      {
        $match: { id: conversationId },
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
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

// remove user from admin
async function removeUserAdmin(conversationId: Types.ObjectId, userId: Types.ObjectId) {
  try {
    const updatedGroup = await Group.findOneAndUpdate(
      { id: conversationId },
      {
        $pull: { admins: userId },
      },
      { new: true }
    );

    return await Group.aggregate([
      {
        $match: { id: conversationId },
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
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

async function clearGroupConversation(req: IDeleteConversationRequest) {
  try {
    const res = await Group.updateOne(
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
    console.log("clearGroupConversation---------->", error);
  }
}

async function addGroupTag(req: { id: string; tag: string }) {
  try {
    const res = await Group.findOneAndUpdate(
      { id: req.id },
      {
        $push: {
          tags: req.tag,
        },
      }
    );
    console.log(res);
    return res;
  } catch (error) {
    console.log("addTag---------->", error);
  }
}

async function removeGroupTag(req: { id: string; tag: string }) {
  try {
    const res = await Group.findOneAndUpdate(
      { id: req.id },
      {
        $pull: {
          tags: req.tag,
        },
      }
    );
    console.log(res);
    return res;
  } catch (error) {
    console.log("removeGroupTag---------->", error);
  }
}

export {
  createGroup,
  generateGroupInvitationId,
  fetchGroups,
  fetchGroupsByUserId,
  addMembersToGroup,
  removeMemberFromGroup,
  updateGroupMemberRole,
  updateGroup,
  deleteGroup,
  fetchGroupById,
  makeUserAdmin,
  removeUserAdmin,
  clearGroupConversation,
  addGroupTag,
  removeGroupTag,
};
