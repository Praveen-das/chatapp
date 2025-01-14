import { Request, Response } from "express";
import conversationServices from "../services/conversationServices";
import { Types } from "mongoose";
import {
  IConversation,
  IGroupConversation,
  IUserConversation,
} from "../interfaces/conversationInterface";

const _createConversation = async (req: string, reset: () => void) => {
  try {
    const { conversation }: { conversation: IConversation } = JSON.parse(req);

    let members = conversation.members.map((m) => new Types.ObjectId(m.id));

    let _conversation = {
      ...conversation,
      id: new Types.ObjectId(conversation.id),
      members,
    };

    const response =
      await conversationServices.createConversation(_conversation);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _createUserConversation = async (req: string, reset: () => void) => {
  try {
    let { userConversations }: { userConversations: IUserConversation[] } =
      JSON.parse(req);

    userConversations = userConversations.map((userConversation) => ({
      ...userConversation,
      id: new Types.ObjectId(userConversation.id),
      userId: new Types.ObjectId(userConversation.userId),
      conversationId: new Types.ObjectId(userConversation.conversationId),
    }));

    const response =
      await conversationServices.createUserConversation(userConversations);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _createGroupConversation = async (req: string, reset: () => void) => {
  try {
    let { groupConversations }: { groupConversations: IGroupConversation[] } =
      JSON.parse(req);

    groupConversations = groupConversations.map((groupConversation) => ({
      ...groupConversation,
      id: new Types.ObjectId(groupConversation.id),
      userId: new Types.ObjectId(groupConversation.userId),
      conversationId: new Types.ObjectId(groupConversation.conversationId),
    }));

    const response =
      await conversationServices.createGroupConversation(groupConversations);
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _deleteGroupConversation = async (req: string, reset: () => void) => {
  try {
    const parsed: string = JSON.parse(req);
    let id = new Types.ObjectId(parsed);
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
  const userId = req.params.userId;

  try {
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

    const conversationId = new Types.ObjectId(parsed.id as string);
    const updates = parsed.updates;

    const response = await conversationServices.updateUserConversationById(
      conversationId,
      updates
    );
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _updateGroupConversationById = async (req: string, reset: () => void) => {
  try {
    const parsed = JSON.parse(req);

    const conversationId = new Types.ObjectId(parsed.id as string);
    const updates = parsed.updates;

    const response = await conversationServices.updateGroupConversationById(
      conversationId,
      updates
    );
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _updateUserConversationBlockStatus = async (
  req: string,
  reset: () => void
) => {
  try {
    const parsed = JSON.parse(req);

    const conversationId = new Types.ObjectId(parsed.conversationId as string);
    const userId = new Types.ObjectId(parsed.userId as string);
    const requestedUserId = new Types.ObjectId(
      parsed.requestedUserId as string
    );

    const response =
      await conversationServices.updateUserConversationBlockStatus({
        ...parsed,
        conversationId,
        userId,
        requestedUserId,
      });
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _updateConversationById = async (req: Request, res: Response) => {
  const { conversationId, ...updates } = req.body;

  try {
    const response = await conversationServices.updateConversationById(
      conversationId,
      {
        ...updates,
        updatedAt: Date.now(),
      }
    );
    res.json(response);
  } catch (error) {
    console.log(error);
    res.json(error);
  }
};

async function _addToArchive(req: Request<{ id: string }>, res: Response) {
  if (!req.body) return;
  const id = new Types.ObjectId(req.params.id!);

  await conversationServices.addToArchive(id);
  res.json("ok");
}

async function _removeFromArchive(req: Request<{ id: string }>, res: Response) {
  if (!req.body) return;
  const id = new Types.ObjectId(req.params.id!);

  await conversationServices.removeFromArchive(id);
  res.json("ok");
}

const _registerStarredMessages = async (req: string, reset: () => void) => {
  try {
    const parsed: { conversationId: string; messageIds: string[];host: string } = JSON.parse(req);
    const conversationId = new Types.ObjectId(parsed.conversationId);
    const messageIds = parsed.messageIds.map(
      (id) => new Types.ObjectId(id)
    );

    const response = await conversationServices.registerStarredMessages(
      conversationId,
      messageIds,
      parsed.host
    );
  } catch (error) {
    console.log(error);
    reset();
  }
};

const _unregisterStarredMessages = async (req: string, reset: () => void) => {
  try {
    const parsed: { conversationId: string; messageId: string;host: string } = JSON.parse(req);

    const conversationId = new Types.ObjectId(parsed.conversationId);
    const messageId = new Types.ObjectId(parsed.messageId)

    const response = await conversationServices.unregisterStarredMessages(
      conversationId,
      messageId,
      parsed.host
    );
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
  _updateConversationById,
  _updateUserConversationById,
  _updateGroupConversationById,
  _updateUserConversationBlockStatus,
  _clearConversation,
  _addToArchive,
  _removeFromArchive,
  _registerStarredMessages,
  _unregisterStarredMessages,
};
