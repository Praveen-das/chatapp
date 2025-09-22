import { Request, Response } from "express";
import conversationServices from "../services/conversationServices";
import { Types } from "mongoose";
import { conversationSchema, userConversationsSchema, conversationBlockRequest } from "../schemas/conversationSchema";
import { groupConversationsSchema } from "../schemas/groupSchema";
import { objectId } from "../schemas/objectId";

const _createConversation = async (req: string, reset: () => void) => {
  try {
    const { conversation: body } = JSON.parse(req);

    let conversation = conversationSchema.parse(body);

    const response = await conversationServices.createConversation(conversation);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _createUserConversation = async (req: string, reset: () => void) => {
  try {
    let { userConversations: body } = JSON.parse(req);
    const userConversations = userConversationsSchema.parse(body);

    const response = await conversationServices.createUserConversation(userConversations);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _createGroupConversation = async (req: string, reset: () => void) => {
  try {
    let { groupConversations: body } = JSON.parse(req);

    const groupConversations = groupConversationsSchema.parse(body);

    const response = await conversationServices.createGroupConversation(groupConversations);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _deleteGroupConversation = async (req: string, reset: () => void) => {
  try {
    const parsed: string = JSON.parse(req);
    let id = objectId.parse(parsed);
    const response = await conversationServices.deleteGroupConversation(id);
  } catch (error) {
    console.log(error);
    reset();
  }
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
    const parsed: { conversationId: string; messageIds: string[]; host: string } = JSON.parse(req);
    const conversationId = objectId.parse(parsed.conversationId);
    const messageIds = parsed.messageIds.map((id) => objectId.parse(id));

    const response = await conversationServices.registerStarredMessages(conversationId, messageIds, parsed.host);
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

export default {
  _createConversation,
  _createUserConversation,
  _createGroupConversation,
  _deleteGroupConversation,
  _fetchAllConversations,
  _getUserConversation,
  _updateUserConversationById,
  _updateGroupConversationById,
  _updateUserConversationBlockStatus,
  _clearConversation,
  _registerStarredMessages,
  _unregisterStarredMessages,
};
