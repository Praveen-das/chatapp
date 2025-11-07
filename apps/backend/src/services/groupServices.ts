import { IGroup } from "@repo/interfaces/groupInterface";
import mongoose, { Types, startSession } from "mongoose";
import { z } from "zod";
import {
  activityLookup,
  groupLookup,
  membersLookup,
  messagesLookup,
  starredMessagesLookup,
  userLookupPipeline,
} from "../db/stages/stages";
import GroupConversation from "../models/GroupConversation";
import Group from "../models/groupModel";
import Member from "../models/MemberModel";
import {
  conversationClearReq,
  groupConversationsSchema,
  groupMembersSchema,
  groupSchema,
} from "../schemas/groupSchema";
import conversationServices from "./conversationServices";

// createGroup
async function createGroup(
  { members, ...data }: z.infer<typeof groupSchema>,
  groupConversations: z.infer<typeof groupConversationsSchema>
) {
  const session = await startSession();
  try {
    const res = await session.withTransaction(async () => {
      const group = await Group.create([data], { session });

      if (!group[0] || group.length === 0) throw new Error("Group creation failed");

      const conversations = await conversationServices.createGroupConversation(groupConversations, session);
      const createdMembers = await Member.insertMany(members, { session });

      group[0].members = createdMembers.map((m) => m._id);
      await group[0].save();

      return conversations;
    });

    return res;
  } catch (error) {
    await session.abortTransaction();
    console.log("createGroup----------------->", error);
  } finally {
    await session.endSession();
  }
}

// generate InvitationId
async function generateGroupInvitationId(groupId: string) {
  try {
    const invitationId = new Types.ObjectId();
    const id = new Types.ObjectId(groupId);

    await Group.findOneAndUpdate({ id }, { invitationId, $inc: { version: 1 } });

    return {
      groupId,
      invitationId,
    };
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
        $match: { id },
      },
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
            ...userLookupPipeline(),
          ],
          as: "members",
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
          members: "$members.user",
        },
      },
    ]);

    return groups[0];
  } catch (error) {
    console.log("fetchGroupById--->", error);
  }
}

async function fetchGroupByInvitationId(groupId: string) {
  try {
    const id = new Types.ObjectId(groupId);
    const groups = await Group.aggregate([
      {
        $match: { invitationId: id },
      },
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
            ...userLookupPipeline(),
          ],
          as: "members",
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
          members: "$members.user",
        },
      },
    ]);

    return groups;
  } catch (error) {
    console.log("fetchGroupByInvitationId--->", error);
  }
}

async function fetchGroupsByUserId(userId: Types.ObjectId) {
  try {
    const groups = await GroupConversation.aggregate([
      {
        $match: { userId },
      },

      ...groupLookup(),

      ...membersLookup(),

      activityLookup(),

      messagesLookup({ userId }),

      starredMessagesLookup(),

      {
        $addFields: {
          currentParticipation: { $arrayElemAt: ["$activityLog", -1] },
        },
      },
      {
        $project: {
          conversation: 0,
          activityLog: 0,
        },
      },
    ]);

    return groups;
  } catch (error) {
    console.log("fetchGroupsByUserId--->", error);
    return [];
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
    console.log("fetchGroups--->", error);
  }
}

// updateGroupMemberRole
async function updateGroupMemberRole(_groupId: string, _userId: string, isAdmin: boolean) {
  try {
    const groupId = new Types.ObjectId(_groupId);
    const userId = new Types.ObjectId(_userId);
    const updatedGroup = await Group.findOneAndUpdate(
      { id: groupId, "members.userId": userId },
      { $set: { "members.$.isAdmin": isAdmin }, $inc: { version: 1 } },
      { new: true }
    );

    return updatedGroup;
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

async function addMembersToGroup(groupId: Types.ObjectId, members: z.infer<typeof groupMembersSchema>) {
  try {
    const session = await startSession();
    const res = await session.withTransaction(async () => {
      const newMember = await Member.insertMany(members, { session });

      const updatedGroup = await Group.findOneAndUpdate(
        { id: groupId },
        {
          $push: { members: members.map((m) => m._id) },
          $inc: { version: 1 },
        },
        { session, new: true }
      );

      return [newMember, updatedGroup];
    });

    await session.endSession();
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

// removeMemberFromGroup
type RemoveMemberParams = { conversationId: Types.ObjectId; userId: Types.ObjectId; memberId: Types.ObjectId };

async function removeMemberFromGroup({ conversationId, userId, memberId }: RemoveMemberParams) {
  try {
    const session = await startSession();
    const response = await session.withTransaction(async () => {
      const res = await Group.findOneAndUpdate(
        { id: conversationId },
        {
          $pull: { members: memberId, admins: userId },
          $inc:{version:1}
        },
        { session, new: true }
      );

      const res2 = await Member.findByIdAndUpdate(memberId, { exitedAt: Date.now() }, { session, new: true });
      return [res, res2];
    });
    await session.endSession();
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

// updateGroup
async function updateGroup(conversationId: Types.ObjectId, updates: Partial<IGroup>) {
  try {
    const updatedGroup = await Group.findOneAndUpdate(
      { id: conversationId },
      { ...updates, $inc: { version: 1 } },
      { new: true }
    );
    // return await Group.aggregate([
    //   {
    //     $match: { id: conversationId },
    //   },
    //   {
    //     $lookup: {
    //       from: "users",
    //       localField: "members.id",
    //       foreignField: "id",
    //       as: "members",
    //     },
    //   },
    // ]);
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
        $inc:{version:1}
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
        $inc:{version:1}
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

async function clearGroupConversation({
  groupId: conversationId,
  userId,
  recentMember,
}: z.infer<typeof conversationClearReq>) {
  const session = await mongoose.startSession();
  try {
    const res = await session.withTransaction(async () => {
      const r2 = await Member.findByIdAndUpdate(recentMember, { joinedAt: Date.now() }, { session });
      const r1 = await Member.deleteMany({ conversationId, userId, _id: { $ne: recentMember } }, { session });

      return [r1, r2];
    });
    await session.endSession();
  } catch (error) {
    session.abortTransaction();
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
        $inc:{version:1}
      }
    );

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
        $inc:{version:1}
      }
    );

    return res;
  } catch (error) {
    console.log("removeGroupTag---------->", error);
  }
}

export {
  addGroupTag,
  addMembersToGroup,
  clearGroupConversation,
  createGroup,
  deleteGroup,
  fetchGroupById,
  fetchGroupByInvitationId,
  fetchGroups,
  fetchGroupsByUserId,
  generateGroupInvitationId,
  makeUserAdmin,
  removeGroupTag,
  removeMemberFromGroup,
  removeUserAdmin,
  updateGroup,
  updateGroupMemberRole,
};
