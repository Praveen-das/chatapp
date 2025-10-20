import { IConversation, INewConversation } from "@repo/interfaces/conversationInterface";
import {
  IAttachment,
  IImageAttachment,
  IReadReceiptUpdatesCollection,
  IUpdates,
  IUrlAttachment,
} from "@repo/interfaces/messageInterface";
import ObjectID from "bson-objectid";
import { IMessageReadReceipt } from "enums/enums";
import { useMessageStore } from "store/messageStore";
import { decrypt } from "./e2e";
import { IUser } from "@repo/interfaces/userInterface";
import { useStore } from "store/global";
import { getParticipant } from "./conversation";
import { getSession } from "next-auth/react";
import { IMessage } from "@interfaces/messageInterface";
import { APP_NAME } from "config/constants";

const createMessageTemplate = async (
  conversation: IConversation,
  messageData: {
    message: string;
    attachment?: IAttachment | null;
    replyRequest?: IMessage["reply"] | null;
  }
): Promise<IMessage> => {
  const { user } = (await getSession())!;

  const host = conversation.host;
  const conversationId = (conversation as IConversation).conversationId || conversation?.id;
  const from = user?.id;
  const to = host === "group" ? conversation?.channelId! : getParticipant(conversation as IConversation)?.id!;

  const readReceipt =
    conversation.host !== "system"
      ? conversation.members
          .filter((member) => member.id !== user?.id)
          .map((member) => ({
            userId: member.id,
            status: IMessageReadReceipt.sent,
          }))
      : [];

  return {
    id: new ObjectID().toHexString(),
    from,
    to,
    conversationId,
    message: messageData.message,
    type: "message",
    timestamp: Date.now(),
    attachment: messageData.attachment,
    reply: messageData.replyRequest ?? undefined,
    readReceipt,
    deleted: false,
  };
};

export const generateMessageTemplate = (
  conversation: IConversation,
  message: string,
  attachment?: IAttachment
) => {
  const replyRequest = useMessageStore.getState().replyRequest;

  return createMessageTemplate(conversation, {
    message,
    attachment,
    replyRequest,
  });
};

export const regenerateMessageTemplate = (
  conversation: IConversation,
  { message, attachment }: IMessage
) => {
  return createMessageTemplate(conversation, { message, attachment });
};

export function processMessagesForUser(
  user: IUser,
  status: IMessageReadReceipt,
  messages: IMessage[] = [],
  updatesCollection: IUpdates,
  conversation: IConversation
) {
  const unreadMessages: IMessage[] = [];
  const imageAttachments: IImageAttachment[] = [];
  const urlAttachments: IUrlAttachment[] = [];
  const placeholders: IMessage[] = [];
  const newMessages: IMessage[] = [];
  const receiver = getParticipant(conversation);
  const isSystemMessage = conversation.host === "system";

  if (!messages || messages.length === 0) {
    return {
      unreadMessages,
      imageAttachments: [],
      urlAttachments,
      messages,
      updatesCollection,
    };
  }

  for (let message of messages) {
    const isUserMessage = message.type === "message";
    const isPlaceholder = message.type === "placeholder";

    if (isUserMessage || isPlaceholder) {
      if (message?.message) message.message = decrypt(message.message);
      if (message?.reply?.message) message.reply.message = decrypt(message.reply.message);
    }

    if (isPlaceholder) {
      message.type = "message";
      placeholders.push(message);
    } else newMessages.push(message);

    // if(!isSystemMessage) message.user = receiver;

    if (isUserMessage)
      message.readReceipt.forEach((readReceipt) => {
        if (readReceipt.userId === user.id) {
          if (readReceipt?.status === IMessageReadReceipt.sent) {
            const update: IReadReceiptUpdatesCollection = {
              id: message.id,
              readReceipt: [{ userId: user.id, status }],
            };

            let key = {
              conversationId: message.conversationId!,
              to: message.from!,
            };

            updatesCollection.upsert(key, update);
          }
          if (readReceipt?.status < IMessageReadReceipt.seen) {
            unreadMessages.push(message);
          }
        }
      });

    const { imageAttachment, urlAttachment } = parseAttachments(message, conversation);

    if(imageAttachment) imageAttachments.push(imageAttachment);
    if(urlAttachment) urlAttachments.push(urlAttachment);
  }

  return {
    unreadMessages,
    imageAttachments,
    urlAttachments,
    messages: newMessages,
    placeholders,
  };
}

export function parseAttachments(message: IMessage, conversation: IConversation) {
  if (message.attachment) {
    const isSystemMessage = conversation.host === "system";
    const receiver = !isSystemMessage ? conversation.members.find((m) => m.id === message.from) : undefined;

    let attachment = message.attachment;

    if (attachment.type === "images") {
      attachment.sender = receiver;
      return { imageAttachment: attachment };
    }

    if (attachment.type === "link") return { urlAttachment: attachment };
  }

  return { imageAttachment: undefined, urlAttachment: undefined };
}

export function getReadReceiptChanges(messages: { key: any; value: any }[] = []) {
  const updatesCollection: IUpdates = new Map();

  if (!!messages.length) {
    messages.forEach(({ key, value }) => {
      updatesCollection.upsert(key, value);
    });
  }

  return updatesCollection;
}
