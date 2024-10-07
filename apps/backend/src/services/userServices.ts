import { Types } from "mongoose";
import { IUBlockReq, IUser } from "../interfaces/userInterface.js";
import User from "../models/UserModal.js";
import BlockedUsersModel from "../models/blockedConnectionModal.js";

async function createUser(user: IUser) {
  try {
    const result = await User.create(user);
    return result;
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

async function getUserById(userId: Types.ObjectId) {
  try {
    const result = await User.find({ id: userId });
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function updateUser(_userId: string, updates: Partial<IUser>) {
  const userId = new Types.ObjectId(_userId);
  try {
    const result = await User.findOneAndUpdate(
      { id: userId },
      { ...updates },
      { new: true }
    );
    return result;
  } catch (error) {
    console.error("Error:", error);
    // throw error; // Rethrow the error if needed
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

async function blockUser(req: IUBlockReq) {
  try {
    const result = await BlockedUsersModel.create({
      createtAt: Date.now(),
      ...req,
    });
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function unblockUser(id: Types.ObjectId) {
  try {
    const result = await BlockedUsersModel.findOneAndDelete({ id });
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function getBlockedListByUserId(userId: Types.ObjectId) {
  try {
    const result = await BlockedUsersModel.aggregate([
      {
        $match: {
          $or: [{ userId }, { blockedId: userId }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "blockedId",
          foreignField: "id",
          as: "blockedUser",
        },
      },
      { $unwind: "$blockedUser" },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $project: { _id: 0, blockedId: 0, userId: 0 } },
    ]);

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

export default {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  getBlockedListByUserId,
};
