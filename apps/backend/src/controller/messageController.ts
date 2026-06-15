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
import CryptoJS from "crypto-js";

const _saveUserMessage = async (collection: IMessage[], reset: () => void) => {
  try {
    const parsedMessages = messagesSchema.parse(collection);
    const messages = await messageServices.saveUserMessage(parsedMessages);
  } catch (error) {
    console.log("_saveUserMessage error--->", error);
    reset();
  }
};

const _saveMessages = async (req: Request, res: Response) => {
  try {
    if (!req.body) return;

    const messages = messagesSchema.parse(req.body);

    const response = await messageServices.saveUserMessage(messages);

    return res.json(response);
  } catch (error) {
    console.log("MESSAGES error--->", error);
    return res.json({ error });
  }
};

const encrypt = (message: string) => {
  const encrypted = CryptoJS.AES.encrypt(message, "obvwoqcbv21801f19d0zibcoavwpnq").toString();
  return encrypted;
};

function generateMockConversation({
  conversationId,
  from,
  to,
  count,
}: {
  from: Types.ObjectId;
  to: Types.ObjectId;
  conversationId: Types.ObjectId;
  count: number;
}) {
  const messages: IMessage[] = [];
  for (let i = 0; i < count; i++) {
    const sender = Math.random() < 0.5 ? from : to;
    const receiver = sender === from ? to : from;

    messages.push({
      id: new Types.ObjectId(),
      from: sender,
      to: receiver,
      conversationId,
      message: encrypt(`Mock message #${i + 1} from user ${sender}`),
      timestamp: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24),
      type: "message",
      readReceipt: [
        { status: 2, userId: from.toHexString() },
        { status: 2, userId: to.toHexString() },
      ],
    });
  }

  return messages;
}

const _generateMockMessages = async (
  req: Request<any, any, { from: string; to: string; conversationId: string; count: number }>,
  res: Response,
) => {
  try {
    if (!req.body) return res.json("data not found");
    if (!req.body.from) return res.json("from not found");
    if (!req.body.to) return res.json("to not found");
    if (!req.body.conversationId) return res.json("conversationId not found");

    const from = new Types.ObjectId(req.body.from);
    const to = new Types.ObjectId(req.body.to);
    const conversationId = new Types.ObjectId(req.body.conversationId);

    const messages = generateMockConversation({ conversationId, from, to, count: Number(req.body.count || 10) });

    const response = await messageServices.generateMockMessages(messages);

    return res.json(response?.length);
  } catch (error) {
    console.log("MESSAGES error--->", error);
    return res.json({ error });
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
  const { c: timestamp, host, activityLog, limit = LIMIT, deletedAt, ...body } = req.query;

  const authUserId = (req as any).authUserId;
  if (!authUserId || authUserId !== body.userId) {
    return res.status(403).json({ error: "Forbidden: cannot access another user's messages" });
  }

  const _LIMIT = Number(limit);
  const CURSOR = Number(timestamp);
  const _deletedAt = Number(deletedAt);
  const conversationId = new Types.ObjectId(body.cid);
  const userId = new Types.ObjectId(body.userId);

  try {
    if (host === "user") {
      const messages = await messageServices.getUserMessages({
        conversationId,
        userId,
        limit: _LIMIT,
        cursor: CURSOR,
        deletedAt: _deletedAt,
      });

      return res.json(messages);
    }

    if (host === "group") {
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

const _savePendingReencryptRequest = async (req: string, reset: () => void) => {
  try {
    const payload = JSON.parse(req);
    await messageServices.savePendingReencryptRequest(payload);
  } catch (error) {
    console.log("SAVE_REENCRYPT_REQUEST error--->", error);
    reset();
  }
};

const _resolvePendingReencryptRequest = async (req: string, reset: () => void) => {
  try {
    const payload = JSON.parse(req);
    await messageServices.resolvePendingReencryptRequest(payload);
  } catch (error) {
    console.log("RESOLVE_REENCRYPT_REQUEST error--->", error);
    reset();
  }
};

const _getPendingReencryptRequests = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const authUserId = (req as any).authUserId;
    if (!authUserId || authUserId !== userId) {
      return res.status(403).json({ error: "Forbidden: cannot access another user's pending requests" });
    }

    const requests = await messageServices.getPendingReencryptRequests(userId as string);
    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const _getMessagesByIds = async (req: Request, res: Response) => {
  try {
    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: "messageIds array is required" });
    }

    const messages = await messageServices.getMessagesByIds(messageIds);
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error });
  }
};

const _saveFailedReencryptions = async (req: string, reset: () => void) => {
  try {
    const { failures } = JSON.parse(req);
    await messageServices.saveFailedReencryptions(failures);
  } catch (error) {
    console.log("SAVE_FAILED_REENCRYPTIONS error--->", error);
    reset();
  }
};

export default {
  _generateMockMessages,
  _saveMessages,
  _saveUserMessage,
  _updateUserMessages,
  _deleteMessagesForUser,
  _getUserMessages,
  _deleteUserMessage,
  _savePendingReencryptRequest,
  _resolvePendingReencryptRequest,
  _getPendingReencryptRequests,
  _getMessagesByIds,
  _saveFailedReencryptions,
};
