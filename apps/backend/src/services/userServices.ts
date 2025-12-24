import { Types } from "mongoose";
import { IUser } from "../interfaces/userInterface.js";
import User from "../models/UserModal.js";
import { z } from "zod";
import { bulkUpdateUsersSchema, updateUserSchema } from "../schemas/userSchema.js";
import conversationController from "../controller/conversationController";
import { MongoServerError } from "mongodb";
import Conversations from "../models/ConversationModel.js";
import UserConversation from "../models/UserConversation.js";

async function createUser(payload: IUser) {
  try {
    const user = await User.create(payload);

    await Promise.all([
      conversationController.createSystemConversation(user?.id),
      conversationController.createAiConversation(user?.id),
    ]);

    return user;
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof MongoServerError) {
      console.error("Error:", error.codeName);
      return { error: { message: error.codeName, code: error.code } };
    }

    return error; // Rethrow the error if needed
  }
}

async function fetchUnsyncUsers(unsyncUsers: string[]) {
  if (!unsyncUsers.length) return Promise.resolve(null);

  try {
    const result = await User.find({ id: { $in: unsyncUsers.map((id) => new Types.ObjectId(id)) } });
    return result.reduce<Record<string, IUser>>((i, u: any) => {
      if (u.id) i[u.id] = u;
      return i;
    }, {});
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function getAllUsers() {
  try {
    const result = await User.find();
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function queryUser(query: string) {
  try {
    const result = await User.findOne({ $or: [{ username: query }, { phoneNumber: query }] });
    return result;
  } catch (error) {
    console.error("queryUser Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function getUserByPhoneNumber(phoneNumber: string) {
  try {
    const user = await User.findOne({ phoneNumber });
    return user;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function getUserById(userId: Types.ObjectId) {
  try {
    const result = await User.findOne({ id: userId });
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function updateUser({ id, updates }: z.infer<typeof updateUserSchema>) {
  try {
    const result = await User.findOneAndUpdate({ id }, { ...updates, $inc: { version: 1 } }, { new: true });
    return result;
  } catch (error) {
    if (error instanceof MongoServerError) {
      console.error("Error:", error.codeName);
      return { error: { message: error.codeName, code: error.code } };
    }
  }
}

async function bulkUpdateUsers(users: z.infer<typeof bulkUpdateUsersSchema>) {
  try {
    const updates = users.map((user) => ({
      updateOne: {
        filter: { id: user.id },
        update: { $set: user.updates },
        upsert: true,
      },
    }));

    const result = await User.bulkWrite(updates);
    return result;
  } catch (error) {
    if (error instanceof MongoServerError) {
      console.error("Error:", error.codeName);
      return { error: { message: error.codeName, code: error.code } };
    }
  }
}

async function updateUserRule({ userId, rule, action }: any) {
  try {
    const updates =
      action === "add" ? { $push: { rules: rule } } : action === "remove" ? { $pull: { rules: rule } } : null;

    if (updates === null) return null;

    const result = await User.findOneAndUpdate(
      { id: new Types.ObjectId(userId as string) },
      { ...updates, $inc: { version: 1 } },
      { new: true }
    );
    return result;
  } catch (error) {
    if (error instanceof MongoServerError) {
      console.error("Error:", error.codeName);
      return { error: { message: error.codeName, code: error.code } };
    }
  }
}

async function deleteUser(userId: Types.ObjectId) {
  try {
    const result = await User.deleteOne({ id: userId });
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function getUsersFromConversations(userId: Types.ObjectId) {
  if (!userId) return [];

  try {
    const res = (await UserConversation.aggregate([
      {
        $unionWith: {
          coll: "groupconversations",
          pipeline: [],
        },
      },

      {
        $match: { userId },
      },

      {
        $lookup: {
          from: "members",
          let: { convId: "$conversationId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$conversationId", "$$convId"] }, { $ne: ["$userId", userId] }],
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "id",
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $project: {
                _id: 0,
                userId: "$userId",
                user: "$user",
              },
            },
          ],
          as: "members",
        },
      },

      {
        $project: {
          members: 1,
        },
      },

      {
        $unwind: "$members",
      },

      {
        $group: {
          _id: "$members.userId",
          user: { $first: "$members.user" },
        },
      },

      {
        $group: {
          _id: null,
          usersArray: {
            $push: {
              k: { $toString: "$_id" },
              v: "$user",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          users: { $arrayToObject: "$usersArray" },
        },
      },
    ])) as any as Awaited<Array<{ users: IUser[] }>>;

    if (!res[0]?.users) return [];
    return res[0]?.users;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export default {
  createUser,
  getAllUsers,
  queryUser,
  getUserById,
  updateUser,
  deleteUser,
  getUserByPhoneNumber,
  updateUserRule,
  fetchUnsyncUsers,
  getUsersFromConversations,
  bulkUpdateUsers,
};
