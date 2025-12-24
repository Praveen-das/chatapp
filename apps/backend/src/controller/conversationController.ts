import { Request, Response } from "express";
import conversationServices from "../services/conversationServices";
import { Types } from "mongoose";
import { conversationSchema, userConversationsSchema, conversationBlockRequest } from "../schemas/conversationSchema";
import { groupConversationsSchema, membersSchema } from "../schemas/groupSchema";
import { objectId } from "../schemas/objectId";
import { syncRegistry } from "../lib/SyncRegistry";
import { handleUpdatingGroupConversationSyncState } from "../services/utils/conversation";
import { SaveConversationSyncState } from "@repo/interfaces/syncRegistryInterface";
import { readReceiptSchema, readReceiptsSchema } from "../schemas/readReceiptSchema";
import messageServices from "../services/messageServices";

const _createConversation = async (req: string, reset: () => void) => {
  try {
    const parsed = JSON.parse(req);

    if (!parsed.conversation) throw Error("Conversation empty");
    if (!parsed.userConversations) throw Error("UserConversations empty");
    if (!parsed.participants) throw Error("participants empty");

    let conversationBody = conversationSchema.parse(parsed.conversation);
    const userConversationsBody = userConversationsSchema.parse(parsed.userConversations);
    const participantsCollection = membersSchema.parse(parsed.participants);

    const response = await conversationServices.saveConversations({
      conversationBody,
      userConversationsBody,
      participantsCollection,
    });

    if (response) {
      const c = response.conversation!;
      const state: SaveConversationSyncState[] = [
        { conversationId: c?.id!, fieldValues: ["conversationId", c.id, "version", c.version] },
      ];
      syncRegistry.saveConversationSyncState(state);
    }
  } catch (error) {
    console.log(error);
    reset();
  }
};

// const _createUserConversation = async (req: string, reset: () => void) => {
//   try {
//     let { userConversations: body } = JSON.parse(req);
//     const userConversations = userConversationsSchema.parse(body);

//     const response = await conversationServices.createUserConversation(userConversations);
//   } catch (error) {
//     console.log(error);
//     reset();
//   }
// };

const _createGroupConversation = async (req: string, reset: () => void) => {
  try {
    let { groupConversations: body } = JSON.parse(req);
    const groupConversations = groupConversationsSchema.parse(body);
    const response = await conversationServices.createGroupConversation(groupConversations);
    if (response?.ok) await handleUpdatingGroupConversationSyncState(groupConversations);
  } catch (error) {
    console.log("_createGroupConversation----->", error);
    reset();
  }
};

const _deleteGroupConversation = async (req: string, reset: () => void) => {
  try {
    const parsed: any = JSON.parse(req);

    let userId = objectId.parse(parsed.userId);
    let groupId = objectId.parse(parsed.groupId);

    const response = await conversationServices.deleteGroupConversation(userId, groupId);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const createAiConversation = async (userId: Types.ObjectId) => {
  const conversation = await conversationServices.createConversation({
    id: new Types.ObjectId(),
    host: "ai",
  });

  const [response] = await conversationServices.createUserConversation([
    {
      id: new Types.ObjectId(),
      conversationId: conversation.id,
      userId: new Types.ObjectId(userId),
    },
  ]);

  return { ...conversation.toObject(), ...response!.toObject() };
};

const createSystemConversation = async (userId: Types.ObjectId) => {
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
      userId: new Types.ObjectId(userId),
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
};

const _clearConversation = async (req: string, reset: () => void) => {
  try {
    const parsed: any = JSON.parse(req);

    const conversation = {
      ...parsed,
      conversationId: new Types.ObjectId(parsed.conversationId as string),
      userId: new Types.ObjectId(parsed.userId as string),
    };

    await conversationServices.clearConversation(conversation);
  } catch (error) {
    console.log("CLEAR_CONVERSATION_FOR_USER error--->", error);
    reset();
  }
};

const _fetchAllConversations = async (req: Request, res: Response) => {
  try {
    const response = await conversationServices.fetchAllConversations();
    res.json(response);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
};

const _getUserConversation = async (req: Request, res: Response) => {
  try {
    const userId = objectId.parse(req.params.userId);

    if (!userId) throw new Error("userId is required");

    const response = await conversationServices.getUserConversation(userId);
    res.json(response);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
};

const _updateUserConversationById = async (req: string, reset: () => void) => {
  try {
    const parsed = JSON.parse(req);
    const conversationId = objectId.parse(parsed.id);
    const updates = parsed.updates;

    const response = await conversationServices.updateUserConversationById(conversationId, updates);
    // if (response)
    //   syncRegistry.saveUserConversationUpdateState(response.id, response.updatedAt!);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _updateGroupConversationById = async (req: string, reset: () => void) => {
  try {
    const parsed = JSON.parse(req);

    const conversationId = objectId.parse(parsed.id);
    const updates = parsed.updates;

    const response = await conversationServices.updateGroupConversationById(conversationId, updates);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _updateUserConversationBlockStatus = async (req: string, reset: () => void) => {
  try {
    const body = JSON.parse(req);

    const updates = conversationBlockRequest.parse(body);

    const response = await conversationServices.updateUserConversationBlockStatus(updates);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _registerStarredMessages = async (req: string, reset: () => void) => {
  try {
    const parsed: { conversationId: string; messageId: string; host: string } = JSON.parse(req);
    const conversationId = objectId.parse(parsed.conversationId);
    const messageIdParsed = objectId.parse(parsed.messageId);

    const response = await conversationServices.registerStarredMessages(conversationId, messageIdParsed, parsed.host);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _unregisterStarredMessages = async (req: string, reset: () => void) => {
  try {
    const parsed: { conversationId: string; messageId: string; host: string } = JSON.parse(req);

    const conversationId = objectId.parse(parsed.conversationId);
    const messageId = objectId.parse(parsed.messageId);

    const response = await conversationServices.unregisterStarredMessages(conversationId, messageId, parsed.host);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _saveMessageReadReceipt = async (req: string, reset: () => void) => {
  try {
    const parsed = JSON.parse(req);
    const readReceipts = readReceiptsSchema.parse(parsed.readReceipts);
    console.log(readReceipts);

    const response = await conversationServices.saveMessageReadReceipt(readReceipts);
  } catch (error) {
    console.log(error);
    reset();
  }
};

export default {
  _createConversation,
  // _createUserConversation,
  _createGroupConversation,
  createAiConversation,
  createSystemConversation,
  _deleteGroupConversation,
  _fetchAllConversations,
  _getUserConversation,
  _updateUserConversationById,
  _updateGroupConversationById,
  _updateUserConversationBlockStatus,
  _clearConversation,
  _registerStarredMessages,
  _unregisterStarredMessages,
  _saveMessageReadReceipt,
};
