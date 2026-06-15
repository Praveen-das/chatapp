import { MongoServerError } from "mongodb";
import { Types } from "mongoose";
import { z } from "zod";
import conversationController from "../controller/conversationController";
import { IUser, IPublicKeyVersion } from "../interfaces/userInterface.js";
import PublicKeyHistory from "../models/PublicKeyHistoryModel.js";
import UserConversation from "../models/UserConversation.js";
import User from "../models/UserModal.js";
import cache from "../redis/client.js";
import { bulkUpdateUsersSchema, updateUserSchema } from "../schemas/userSchema.js";

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
    const result = await User.find({ id: { $in: unsyncUsers.map((id) => new Types.ObjectId(id)) } }).populate(
      "publicKeyHistory",
    );
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

function resolveActiveKey(publicKeyHistory?: IPublicKeyVersion[]): string | undefined {
  const activeKey = publicKeyHistory?.find((k) => k.status === "active");
  return activeKey?.publicKey;
}

function formatUserProfile(doc: any): IUser | null {
  if (!doc) return null;
  const userObj = typeof doc.toObject === "function" ? (doc.toObject() as unknown as IUser) : (doc as IUser);

  const activeKey = resolveActiveKey(userObj.publicKeyHistory);
  if (activeKey) {
    userObj.publicKey = activeKey;
  }

  return userObj;
}

async function queryUser(query: string) {
  try {
    const result = await User.findOne({ $or: [{ username: query }, { phoneNumber: query }] }).populate(
      "publicKeyHistory",
    );

    return formatUserProfile(result);
  } catch (error) {
    console.error("queryUser Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function getUserByPhoneNumber(phoneNumber: string) {
  try {
    const user = await User.findOne({ phoneNumber });
    return formatUserProfile(user);
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function getUserById(userId: Types.ObjectId) {
  const cacheKey = `userprofile:${userId.toString()}`;
  try {
    const cachedUser = await cache.get(cacheKey);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }
  } catch (e) {
    console.error("Redis read error in getUserById:", e);
  }

  try {
    const result = await User.findOne({ id: userId });

    const formatted = formatUserProfile(result);
    if (formatted) {
      try {
        await cache.set(cacheKey, JSON.stringify(formatted), "EX", 86400);
      } catch (e) {
        console.error("Redis write error in getUserById:", e);
      }
    }
    return formatted;
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw error;
  }
}

async function archiveUserPublicKeyIfNeeded(userId: Types.ObjectId, newPublicKey: string, now: number) {
  // Find currently active key in history
  const currentActiveKey = await PublicKeyHistory.findOne({
    userId,
    status: "active",
  });

  if (currentActiveKey) {
    if (currentActiveKey.publicKey === newPublicKey) {
      // It is already the active key, no action needed
      return;
    }

    // Transition previous active keys to 'archived' status
    await PublicKeyHistory.updateMany({ userId, status: "active" }, { $set: { status: "archived" } });
  }

  // Store new active public key version in the separate collection
  await PublicKeyHistory.create({
    userId,
    publicKey: newPublicKey,
    activatedAt: now,
    status: "active",
  });

  // Invalidate key history cache
  try {
    await cache.del(`keyhistory:${userId.toString()}`);
  } catch (e) {
    console.error("Redis cache invalidation error in archiveUserPublicKeyIfNeeded:", e);
  }
}

async function updateUser({ id, updates }: z.infer<typeof updateUserSchema>) {
  try {
    const result = await User.findOneAndUpdate({ id }, { ...updates, $inc: { version: 1 } }, { new: true });
    if (result) {
      try {
        const cacheKey = `userprofile:${id.toString()}`;
        await cache.set(cacheKey, JSON.stringify(result), "EX", 86400);
      } catch (e) {
        console.error("Redis cache update error in updateUser:", e);
      }
    }
    return result;
  } catch (error) {
    if (error instanceof MongoServerError) {
      console.error("Error:", error.codeName);
      return { error: { message: error.codeName, code: error.code } };
    }
  }
}

async function updateUserPublicKey(userId: Types.ObjectId, publicKey: string) {
  try {
    const now = Date.now();
    await archiveUserPublicKeyIfNeeded(userId, publicKey, now);

    const result = await User.findOneAndUpdate(
      { id: userId },
      { $set: { publicKey, updatedAt: now }, $inc: { version: 1 } },
      { new: true },
    );

    const formated = formatUserProfile(result);

    if (formated) {
      try {
        const cacheKey = `userprofile:${userId.toString()}`;
        await cache.set(cacheKey, JSON.stringify(formated), "EX", 86400);
      } catch (e) {
        console.error("Redis cache update error in updateUserPublicKey:", e);
      }
    }
    return formated;
  } catch (error) {
    console.error("Error in updateUserPublicKey:", error);
    throw error;
  }
}

async function getKeyHistoryByUserId(userId: Types.ObjectId) {
  const cacheKey = `keyhistory:${userId.toString()}`;
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error("Redis read error in getKeyHistoryByUserId:", e);
  }

  try {
    const result = await PublicKeyHistory.find({ userId }).sort({ activatedAt: 1 });
    const formatted = result.map((doc: any) => ({
      publicKey: doc.publicKey,
      activatedAt: doc.activatedAt,
      status: doc.status,
    }));

    try {
      await cache.set(cacheKey, JSON.stringify(formatted), "EX", 86400);
    } catch (e) {
      console.error("Redis write error in getKeyHistoryByUserId:", e);
    }

    return formatted;
  } catch (error) {
    console.error("Error in getKeyHistoryByUserId:", error);
    throw error;
  }
}

async function bulkUpdateUsers(users: z.infer<typeof bulkUpdateUsersSchema>) {
  try {
    const now = Date.now();

    // No E2EE key check loop since public key is handled in updateUserPublicKey

    const updates = users.map((user) => ({
      updateOne: {
        filter: { id: user.id },
        update: { $set: user.updates },
        upsert: true,
      },
    }));

    const result = await User.bulkWrite(updates);

    try {
      const pipeline = cache.pipeline();
      users.forEach((user) => {
        pipeline.del(`userprofile:${user.id}`);
      });
      await pipeline.exec();
    } catch (e) {
      console.error("Redis cache invalidation error in bulkUpdateUsers:", e);
    }

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
      { new: true },
    );

    if (result) {
      try {
        const cacheKey = `userprofile:${userId}`;
        await cache.set(cacheKey, JSON.stringify(result), "EX", 86400);
      } catch (e) {
        console.error("Redis cache update error in updateUserRule:", e);
      }
    }

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
                let: { memberUserId: "$userId" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$id", "$$memberUserId"] },
                    },
                  },
                  {
                    $lookup: {
                      from: "publickeyhistories",
                      localField: "id",
                      foreignField: "userId",
                      as: "publicKeyHistory",
                    },
                  },
                ],
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
    const users = res[0]?.users || {};
    Object.values(users).forEach((u: any) => {
      if (u) {
        const activeKey = resolveActiveKey(u.publicKeyHistory);
        if (activeKey) {
          u.publicKey = activeKey;
        }
      }
    });
    return users;
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
  updateUserPublicKey,
  getKeyHistoryByUserId,
  deleteUser,
  getUserByPhoneNumber,
  updateUserRule,
  fetchUnsyncUsers,
  getUsersFromConversations,
  bulkUpdateUsers,
};
