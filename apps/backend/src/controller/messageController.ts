import cache from "../redis/client";
import { Response, Request } from "express";
import messageServices from "../services/messageServices";
import { IMessage } from "../interfaces/messageInterface";
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
    const { messages, conversation }: IReq = JSON.parse(req);

    if (conversation?.unsaved) {
      delete conversation.unsaved;

      let _conversation = {
        ...conversation,
        id: new Types.ObjectId(conversation.id),
      };

      const _messages = messages.map((message) => ({
        ...message,
        id: new Types.ObjectId(message.id),
        conversationId: _conversation.id,
        from: new Types.ObjectId(message.from),
        to: new Types.ObjectId(message.to),
      }));

      await Promise.all([
        conversationServices.createConversation(_conversation),
        messageServices.saveUserMessage(_messages),
      ]);

      return;
    }

    if (conversation?.deletedForUser) {
      const userId = conversation.userStatus?.id!;

      const req = {
        conversationId: new Types.ObjectId(conversation.id),
        userId: new Types.ObjectId(userId),
        deletedForUser: false,
      };

      await conversationServices.clearConversation(req);
    }

    const _messages = messages.map((message) => {
      let newMessage ={
        ...message,
        id: new Types.ObjectId(message.id),
        conversationId: new Types.ObjectId(message.conversationId),
        from: new Types.ObjectId(message.from),
        to: message.to ? new Types.ObjectId(message.to) : undefined,
      }; 
      if(!message.to) delete message.to
      return newMessage
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

    await messageServices.deleteMessagesForUser(collection);
  } catch (error) {
    console.log("DELETE_MESSAGE_FOR_USER error--->", error);
    reset();
  }
};

const _getMessages = async (req: Express.Request, res: Response) => {
  const messages_cache = await cache.get("messages_cache");

  if (messages_cache) {
    console.log("res send from cache");
    return res.json(JSON.parse(messages_cache));
  }

  const messages = await messageServices.getMessages();

  cache.set("messages_cache", JSON.stringify(messages), () =>
    console.log("data cached")
  );
  cache.expire("messages_cache", TIME_TO_EXPIRE);

  return res.json(messages);
};

const _getUserMessages = async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const cacheKey = `messages_cache:${userId}`;

  try {
    // const messages_cache = await cache.get(cacheKey)

    // if (messages_cache) {
    //     console.log('res send from cache');
    //     return res.json(JSON.parse(messages_cache))
    // }

    const _messages = await messageServices.getUserMessages(userId);

    const messages = _messages;

    // cache.set(
    //     cacheKey,
    //     JSON.stringify(messages),
    //     () => console.log('data cached')
    // )

    cache.expire(cacheKey, TIME_TO_EXPIRE);

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
    console.log(response);
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
  _getUserMessages,
  _deleteUserMessage,
};
