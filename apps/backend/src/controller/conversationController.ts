import { Request, Response } from "express";
import conversationServices from "../services/conversationServices";
import { Types } from "mongoose";

const _createConversation = async (req: Request, res: Response) => {
  const body = req.body;

  let conversation = body.map();

  try {
    const response =
      await conversationServices.createConversation(conversation);
    res.json(response);
  } catch (error) {
    console.log(error);
    res.json(error);
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

async function _addToArchive(req: Request<any,any,{ conversationId: string; userId: string }>, res: Response) {
  if (!req.body) return;
  const conversationId = new Types.ObjectId(req.body.conversationId);
  const userId = new Types.ObjectId(req.body.userId);
  
  await conversationServices.addToArchive(conversationId, userId);
  res.json("ok");
}

async function _removeFromArchive(
  req: Request<any,any,{ conversationId: string; userId: string }>,
  res: Response
) {
  if (!req.body) return;
  const conversationId = new Types.ObjectId(req.body.conversationId);
  const userId = new Types.ObjectId(req.body.userId);
  
  await conversationServices.removeFromArchive(conversationId, userId);
  res.json("ok");
}

export default {
  _createConversation,
  _fetchAllConversations,
  _getUserConversation,
  _updateConversationById,
  _clearConversation,
  _addToArchive,
  _removeFromArchive,
};
