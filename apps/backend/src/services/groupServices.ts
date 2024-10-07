import { Types } from "mongoose";
import { IGroup } from "../interfaces/groupInterface";
import Group from "../models/groupModel";
import {
  IDeleteConversationRequest,
  IMember,
} from "../interfaces/conversationInterface";

// createGroup
async function createGroup(data: IGroup) {
  console.log('creation data',data);
  
  try {
    const group = new Group(data);
    await group.save();

    const populatedGroup = await Group.aggregate([
      {
        $match: { id: group.id },
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
  const id = new Types.ObjectId(groupId);

  try {
    const groups = await Group.aggregate([
      {
        $match: { invitationId: id },
      },
      // {
      //     $lookup: {
      //         from: "messages",
      //         let: { id: "$id" },
      //         pipeline: [
      //             {
      //                 $match: {
      //                     $expr: { $eq: ["$conversationId", "$$id"] }
      //                 },
      //             },
      //         ],
      //         as: "messages"
      //     }
      // },
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

async function fetchGroupsByUserId(id: string) {
  const userId = new Types.ObjectId(id);

  try {
    const groups = await Group.aggregate([
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
        $lookup: {
          from: "users",
          localField: "members.id",
          foreignField: "id",
          as: "members",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "id",
          foreignField: "conversationId",
          let: {
            timeOfJoining: "$userStatus.timeOfJoining",
            timeOfDeletion: "$userStatus.timeOfDeletion",
          },
          pipeline: [
            {
              $lookup: {
                from: "messagedeleteflags",
                let: {
                  id: "$id",
                  userId,
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ["$messageId", "$$id"],
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
                $expr: {
                  $and: [
                    {
                      $ne: ["$messageDeleted.deleted", true],
                    },
                    {
                      $gt: ["$timestamp", "$$timeOfJoining"],
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
        $project: {
          userStatus: 0,
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
async function updateGroupMemberRole(
  _groupId: string,
  _userId: string,
  isAdmin: boolean
) {
  const groupId = new Types.ObjectId(_groupId);
  const userId = new Types.ObjectId(_userId);

  try {
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

async function addMembersToGroup(_conversationId: string, _members: IMember[]) {
  const conversationId = new Types.ObjectId(_conversationId);
  const members = _members.map((m) => ({ ...m, id: new Types.ObjectId(m.id) }));

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
async function removeMemberFromGroup(_conversationId: string, _userId: string) {
  const userId = new Types.ObjectId(_userId);
  const conversationId = new Types.ObjectId(_conversationId);

  try {
    const updatedGroup = await Group.findOneAndUpdate(
      { id: conversationId },
      {
        $pull: { members: { id: userId }, admins: userId },
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

// updateGroup
async function updateGroup(_conversationId: string, updates: Partial<IGroup>) {
  const conversationId = new Types.ObjectId(_conversationId);

  try {
    const updatedGroup = await Group.findOneAndUpdate(
      { id: conversationId },
      updates,
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

// deleteGroup
async function deleteGroup(_groupId: string) {
  const groupId = new Types.ObjectId(_groupId);

  try {
    const updatedGroup = await Group.findByIdAndDelete(groupId);

    return updatedGroup;
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}

// make user as admin
async function makeUserAdmin(_conversationId: string, _userId: string) {
  const conversationId = new Types.ObjectId(_conversationId);
  const userId = new Types.ObjectId(_userId);

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
async function removeUserAdmin(_conversationId: string, _userId: string) {
  const conversationId = new Types.ObjectId(_conversationId);
  const userId = new Types.ObjectId(_userId);

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
};
