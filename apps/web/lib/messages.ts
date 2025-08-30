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
import { getReceiver } from "./conversation";
import { getSession } from "next-auth/react";
import { IMessage } from "@interfaces/messageInterface";
import { APP_NAME } from "config/constants";

const createMessageTemplate = async (
  conversation: IConversation | INewConversation,
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
  const to = host === "group" ? conversation?.channelId! : getReceiver(conversation as IConversation)?.id!;

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
    attachment: messageData.attachment,
    reply: messageData.replyRequest ?? undefined,
    timestamp: Date.now(),
    readReceipt,
    deleted: false,
    user: conversation.host === "group" ? user! : undefined,
    type: "message",
  };
};

export const generateMessageTemplate = (
  conversation: IConversation | INewConversation,
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
  conversation: IConversation | INewConversation,
  { message, attachment }: IMessage
) => {
  return createMessageTemplate(conversation, { message, attachment });
};

export function processMessagesForUser(user: IUser, status: IMessageReadReceipt, messages: IMessage[] = [],updatesCollection:IUpdates) {
  const users = useStore.getState().users;
  const unreadMessages: IMessage[] = [];
  const imageAttachments: IImageAttachment[] = [];
  const urlAttachments: IUrlAttachment[] = [];
  const placeholders: IMessage[] = [];
  const newMessages: IMessage[] = [];

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

    if (isUserMessage) {
      if (message?.message) message.message = decrypt(message.message);
      if (message?.reply?.message) message.reply.message = decrypt(message.reply.message);
    }

    message.user = users.find((u) => u.id === message.from);

    if (isPlaceholder) {
      message.type = "message";
      placeholders.push(message);
    } else newMessages.push(message);

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

    const attachment = parseAttachments(message);

    if (attachment) {
      attachment.imageAttachment && imageAttachments.push(attachment.imageAttachment);
      attachment.urlAttachment && urlAttachments.push(attachment.urlAttachment);
    }
  }

  return {
    unreadMessages,
    imageAttachments,
    urlAttachments,
    messages: newMessages,
    placeholders,
  };
}

export function parseAttachments(message: IMessage) {
  if (message.attachment) {
    let attachment = message.attachment;

    if (attachment.type === "images") {
      attachment.sender =
        message.type === "message"
          ? message.user?.username || message.user?.phoneNumber
          : message.type === "service_message"
            ? APP_NAME
            : "";
      return { imageAttachment: attachment };
    }

    if (attachment.type === "link") return { urlAttachment: attachment };
  }
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
