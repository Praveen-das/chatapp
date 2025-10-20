import { Types } from "mongoose";

import { IDeleteConversationRequest, IUpdateBlockReq } from "@repo/interfaces/conversationInterface.js";
import { z } from "zod";
import {
  conversationLookup,
  conversationMessagesLookup,
  starredMessagesLookup,
  userLookup,
} from "../db/stages/stages.js";
import { IGroupConversation, IUserConversation } from "../interfaces/conversationInterface.js";
import Conversations from "../models/ConversationModel.js";
import GroupConversation from "../models/GroupConversation.js";
import SystemConversation from "../models/SystemConversation.js";
import UserConversation from "../models/UserConversation.js";
import { conversationSchema, systemConversationSchema, userConversationsSchema } from "../schemas/conversationSchema";
import { groupConversationsSchema } from "../schemas/groupSchema";
import Member from "../models/MemberModel.js";
import mongoose from "mongoose";

async function saveConversations(
  conversation: z.infer<typeof conversationSchema>,
  userConversations: z.infer<typeof userConversationsSchema>
) {
  const session = await mongoose.startSession();
  try {

    const result = await session.withTransaction(async () => {
      const result1 = await Conversations.create([conversation], { session });
      const result2 = await UserConversation.insertMany(userConversations, { session });

      return { conversation: result1, userConversations: result2 };
    });

    session.endSession();

    return result;
  } catch (error) {
    session.abortTransaction()
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createConversation(conversation: z.infer<typeof conversationSchema>) {
  try {
    const result = await Conversations.create(conversation);

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createSystemConversation(conversation: z.infer<typeof systemConversationSchema>) {
  try {
    const result = await SystemConversation.create(conversation);

    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createUserConversation(userConversations: z.infer<typeof userConversationsSchema>) {
  try {
    const result = await UserConversation.insertMany(userConversations);

    // return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function createGroupConversation(groupConversations: z.infer<typeof groupConversationsSchema>) {
  try {
    const ops = groupConversations.map((doc) => ({
      updateOne: {
        filter: { userId: doc.userId, conversationId: doc.conversationId },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    }));

    const result = await GroupConversation.bulkWrite(ops, { ordered: false });
    
    console.log(result);
    // return result;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Rethrow the error if needed
  }
}

async function deleteGroupConversation(userId: Types.ObjectId, conversationId: Types.ObjectId) {
  const session = await mongoose.startSession();
  try {
    const res = await session.withTransaction(async () => {
      const deletedMembers = await Member.deleteMany({ userId, conversationId }, { session });
      const deletedConves = await GroupConversation.deleteOne({ userId, conversationId }, { session });
    });

    await session.endSession();
  } catch (error) {
    session.abortTransaction()
    console.error("Error deleteGroupConversation:", error);
    throw error;
  }
}

async function fetchAllConversations() {
  const res = await Conversations.find();
  return res;
}

async function getUserConversation(userId: Types.ObjectId) {
  try {
    const res = await UserConversation.aggregate([
      {
        $match: { userId },
      },

      ...conversationLookup(),

      userLookup({ localField: "members", as: "members" }),

      conversationMessagesLookup(userId),

      starredMessagesLookup(),
    ]);

    return res;
  } catch (error) {
    console.log("getUserConversation-------->", error);
  }
}

async function updateUserConversationById(id: Types.ObjectId, updates: Partial<IUserConversation>) {
  try {
    const res = await UserConversation.findOneAndUpdate({ id }, updates);
    return res;
  } catch (error) {
    console.log("updateConversationById-------->", error);
  }
}

async function updateGroupConversationById(id: Types.ObjectId, updates: Partial<IGroupConversation>) {
  try {
    const res = await GroupConversation.findOneAndUpdate({ id }, updates);
    return res;
  } catch (error) {
    console.log("updateGroupConversationById-------->", error);
  }
}

async function updateUserConversationBlockStatus({ conversationId, userId, requestedUserId, value }: IUpdateBlockReq) {
  try {
    const res = await UserConversation.bulkWrite([
      {
        updateOne: {
          filter: { conversationId, userId },
          update: { $set: { blockedByUser: value } },
        },
      },
      {
        updateOne: {
          filter: { conversationId, userId: requestedUserId },
          update: { $set: { blocked: value } },
        },
      },
    ]);
    return res;
  } catch (error) {
    console.log("updateConversationById-------->", error);
  }
}

async function updateConversationById(id: string, updates: Partial<IUserConversation>) {
  try {
    const res = await Conversations.findOneAndUpdate({ id }, updates);
    return res;
  } catch (error) {
    console.log("updateConversationById-------->", error);
  }
}

async function clearConversation(req: IDeleteConversationRequest) {
  try {
    const res = await Conversations.updateOne(
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
    console.log("clearConversation------->", error);
  }
}

async function unsetConversationDeletion(conversationId: Types.ObjectId) {
  try {
    const res = await Conversations.updateOne(
      { id: conversationId },
      {
        $unset: {
          "members.$[].deletedForUser": "",
        },
      },
      { upsert: true }
    );

    return res;
  } catch (error) {
    console.log("unsetConversationDeletion------->", error);
  }
}

async function addToArchive(id: Types.ObjectId) {
  try {
    const res = await UserConversation.findOneAndUpdate({ id }, { archived: true });

    return res;
  } catch (error) {
    console.log("addToArchive------->", error);
  }
}

async function removeFromArchive(id: Types.ObjectId) {
  try {
    const res = await UserConversation.findOneAndUpdate({ id }, { archived: false });

    return res;
  } catch (error) {
    console.log("removeFromArchive------->", error);
  }
}

async function registerStarredMessages(id: Types.ObjectId, messageId: Types.ObjectId, host: string) {
  try {
    if (host === "user") {
      const res = await UserConversation.findOneAndUpdate({ id }, { $push: { starred: messageId } });
    } else {
      const res = await GroupConversation.findOneAndUpdate({ id }, { $push: { starred: messageId } });
    }
  } catch (error) {
    console.log("registerStarredMessages------->", error);
  }
}

async function unregisterStarredMessages(id: Types.ObjectId, messageId: Types.ObjectId, host: string) {
  try {
    if (host === "user") await UserConversation.findOneAndUpdate({ id }, { $pull: { starred: messageId } });
    if (host === "group") await GroupConversation.findOneAndUpdate({ id }, { $pull: { starred: messageId } });
    if (host === "system") await SystemConversation.findOneAndUpdate({ id }, { $pull: { starred: messageId } });
  } catch (error) {
    console.log("unregisterStarredMessages------->", error);
  }
}

export default {
  saveConversations,
  createConversation,
  createSystemConversation,
  createUserConversation,
  createGroupConversation,
  deleteGroupConversation,
  fetchAllConversations,
  getUserConversation,
  updateConversationById,
  updateUserConversationById,
  updateGroupConversationById,
  updateUserConversationBlockStatus,
  clearConversation,
  unsetConversationDeletion,
  addToArchive,
  removeFromArchive,
  registerStarredMessages,
  unregisterStarredMessages,
};
