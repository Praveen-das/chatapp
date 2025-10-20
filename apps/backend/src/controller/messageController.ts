import cache from "../redis/client";
import { Response, Request } from "express";
import messageServices from "../services/messageServices";
import { IConversation, IUserConversation } from "@repo/interfaces/conversationInterface";
import { IMessage } from "../interfaces/messageInterface";
import { messagesSchema } from "../schemas/userMessageSchema";
import { LIMIT } from "../../const";
import { z } from "zod";
import { memberSchema } from "../schemas/groupSchema";
import { Types } from "mongoose";

const TIME_TO_EXPIRE = 60 * 60 * 24;

interface IReq {
  messages: IMessage[];
  conversation: IUserConversation;
}

const _saveUserMessage = async (req: string, reset: () => void) => {
  try {
    const { messages: body }: IReq = JSON.parse(req);

    const messages = messagesSchema.parse(body);

    await messageServices.saveUserMessage(messages);
  } catch (error) {
    console.log("MESSAGES error--->", error);
    reset();
  }
};

const _updateUserMessages = async (req: string, reset: () => void) => {
  try {
    const { messages } = JSON.parse(req);
    await messageServices.updateUserMessages(messages);
  } catch (error) {
    console.log("UPDATE_MESSAGES error--->", error);
    reset();
  }
};

const _deleteMessagesForUser = async (req: string, reset: () => void) => {
  try {
    const { collection } = JSON.parse(req);

    await messageServices.deleteMessagesForUser(collection);
  } catch (error) {
    console.log("DELETE_MESSAGE_FOR_USER error--->", error);
    reset();
  }
};

type IGetUserMessages = {
  cid: string;
  c: string;
  limit: string;
  userId: string;
  deletedAt: string;
  host: IConversation["host"];
  activityLog: z.infer<typeof memberSchema>[];
};

const _getUserMessages = async (req: Request<{}, {}, {}, IGetUserMessages>, res: Response) => {
  const { c: timestamp, host,activityLog, limit = LIMIT, deletedAt,...body } = req.query;
  const _LIMIT = Number(limit);
  const CURSOR = Number(timestamp);
  const _deletedAt = Number(deletedAt);
  const conversationId = new Types.ObjectId(body.cid)
  const userId = new Types.ObjectId(body.userId)

  try {
    if(host === 'user'){
      const messages = await messageServices.getUserMessages({
        conversationId,
        userId,
        limit: _LIMIT,
        cursor: CURSOR,
        deletedAt: _deletedAt,
      });
      
      return res.json(messages);
    }

    if(host === 'group'){
      const messages = await messageServices.getGroupMessages({
        conversationId,
        userId,
        cursor: CURSOR,
      });

      return res.json(messages);
    }

    return res.json([]);
  } catch (error) {
    return res.send(error);
  }
};

const _deleteUserMessage = async (req: Request, res: Response) => {
  const userId = req.body.userId;
  const messagesId = req.body.messagesId;

  const cacheKey = `messages_cache:${userId}`;

  try {
    const response = await messageServices.deleteUserMessages(messagesId);
    cache.del(cacheKey);
    res.send("ok");
  } catch (error) {
    res.send(error);
  }
};

export default {
  _saveUserMessage,
  _updateUserMessages,
  _deleteMessagesForUser,
  _getUserMessages,
  _deleteUserMessage,
};
