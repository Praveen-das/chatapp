import { IUBlockReq } from "@repo/interfaces/userInterface.js";
import { handleGeneratingConversation } from "@repo/utils/index.js";
import { Types } from "mongoose";
import { IUser } from "../interfaces/userInterface.js";
import User from "../models/UserModal.js";
import BlockedUsersModel from "../models/blockedConnectionModal.js";
import { z } from "zod";
import { updateUserSchema } from "../schemas/userSchema.js";
import conversationServices from "./conversationServices.js";
import messageServices from "./messageServices.js";

async function generateSystemConversation(userId: Types.ObjectId) {
  const MESSAGE_STRING = `Welcome to ChatSpace.
We’re pleased to have you here. This platform is built to support secure, real-time communication that keeps teams connected and information flowing.
Whether you're starting new conversations or continuing existing ones, ChatSpace offers a focused, intuitive environment designed for clarity and collaboration.
Start chatting — your space is ready.
`;

  const conversation = await conversationServices.createConversation({
    id: new Types.ObjectId(),
    host: "system",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  await conversationServices.createUserConversation([
    {
      id: new Types.ObjectId(),
      conversationId: conversation.id,
      userId: userId,
    },
  ]);

  await messageServices.saveUserMessage([
    {
      id: new Types.ObjectId(),
      conversationId: conversation.id,
      to: userId,
      from: "system",
      type: "service_message",
      message: MESSAGE_STRING,
      timestamp: Date.now(),
    },
  ]);
}

async function createUser(payload: IUser) {
  try {
    const user = await User.create(payload);
    generateSystemConversation(user?.id);
    return user;
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
    // generateSystemConversation(user?.id);
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
    const result = await User.findOneAndUpdate({ id }, updates, { new: true });

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
  queryUser,
  getUserById,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  getBlockedListByUserId,
  getUserByPhoneNumber,
};
