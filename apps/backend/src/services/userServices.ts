import { Types } from "mongoose";
import { IUser } from "../interfaces/userInterface.js";
import User from "../models/UserModal.js";
import { z } from "zod";
import { updateUserSchema } from "../schemas/userSchema.js";
import conversationServices from "./conversationServices.js";
import messageServices from "./messageServices.js";
import { MongoServerError } from "mongodb";

async function generateSystemConversation(userId: Types.ObjectId) {
  const MESSAGE_STRING = `Welcome to Chatvia.
We’re pleased to have you here. This platform is built to support secure, real-time communication that keeps teams connected and information flowing.
Whether you're starting new conversations or continuing existing ones, Chatvia offers a focused, intuitive environment designed for clarity and collaboration.
Start chatting — your space is ready.
`;

  const conversation = await conversationServices.createConversation({
    id: new Types.ObjectId(),
    host: "system",
  });

  await conversationServices.createUserConversation([
    {
      id: new Types.ObjectId(),
      conversationId: conversation.id,
      userId: userId,
    },
  ]);

  await messageServices.saveSystemMessage([
    {
      id: new Types.ObjectId(),
      to: userId,
      from: "system",
      conversationId: conversation.id,
      message: MESSAGE_STRING,
      type: "service_message",
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
    if (error instanceof MongoServerError) {
      console.error("Error:", error.codeName);
      return { error: { message: error.codeName, code: error.code } };
    }

    return error; // Rethrow the error if needed
  }
}

async function fetchUnsyncUsers(unsyncUsers: string[]) {
  try {
    const result = await User.find({ id: { $in: unsyncUsers.map((id) => new Types.ObjectId(id)) } });
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
    const result = await User.findOneAndUpdate({ id }, { ...updates, $inc: { version: 1 } }, { new: true });
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
};
