import cache from "../redis/client";
import { Response, Request } from "express";
import messageServices from "../services/messageServices";
import { IAttachment, IMessage } from "../interfaces/messageInterface";
import { IUserConversation } from "../interfaces/conversationInterface";
import { Types } from "mongoose";
import conversationServices from "../services/conversationServices";

const TIME_TO_EXPIRE = 60 * 60 * 24;

interface IReq {
  messages: IMessage[];
  conversation: IUserConversation;
}

const _saveUserMessage = async (req: string, reset: () => void) => {
  try {
    const { messages }: IReq = JSON.parse(req);

    // if (!!conversation?.deletedUsers?.length) {
    //   console.log('reset conversation');

    //   await conversationServices.unsetConversationDeletion(conversation.id);
    // }

    const _messages = messages.map((message) => {
      let newMessage = {
        ...message,
        hasAttachment: !!message.attachment,
        id: new Types.ObjectId(message.id),
        conversationId: new Types.ObjectId(message.conversationId),
        from: new Types.ObjectId(message.from),
        to: message.to ? new Types.ObjectId(message.to) : undefined,
      };
      if (!message.to) delete message.to;
      return newMessage;
    });

    await messageServices.saveUserMessage(_messages);
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
    console.log(collection);

    await messageServices.deleteMessagesForUser(collection);
  } catch (error) {
    console.log("DELETE_MESSAGE_FOR_USER error--->", error);
    reset();
  }
};

// const _getMessages = async (req: Express.Request, res: Response) => {
//   const messages_cache = await cache.get("messages_cache");

//   if (messages_cache) {
//     console.log("res send from cache");
//     return res.json(JSON.parse(messages_cache));
//   }

//   const messages = await messageServices.getMessages();

//   cache.set("messages_cache", JSON.stringify(messages), () =>
//     console.log("data cached")
//   );
//   cache.expire("messages_cache", TIME_TO_EXPIRE);

//   return res.json(messages);
// };

type IGetUserMessages = {
  cid: string;
  c: string;
  limit: string;
};

const _getMessages = async (req: Request<{}, {}, {}, IGetUserMessages>, res: Response) => {
  const { cid: conversationId, c: timestamp, limit } = req.query;
  const LIMIT = parseInt(limit);
  const CURSOR = parseInt(timestamp);

  try {
    const messages = await messageServices.getUserMessages(conversationId, LIMIT, CURSOR);

    const response = {
      messages,
      hasNextPage: messages.length > LIMIT,
    };

    res.json(messages);
  } catch (error) {
    res.send(error);
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
  _getMessages,
  _deleteUserMessage,
};
