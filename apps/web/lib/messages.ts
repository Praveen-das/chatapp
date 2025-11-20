import { INewConversation } from "@repo/interfaces/conversationInterface";
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
import {
  getConversationByConversationId,
  getMemberById,
  getReadReceiptState,
  getReceiverMetadata,
} from "./conversation";
import { getSession } from "next-auth/react";
import { IMessage } from "@interfaces/messageInterface";
import { APP_NAME } from "config/constants";
import { useAttachments } from "store/attachments";
import { IConversation } from "@interfaces/conversationInterface";

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
  const to = host === "group" ? conversation?.channelId! : getReceiverMetadata(conversation as IConversation)?.userId!;

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
    deleted: false,
  };
};

export const generateMessageTemplate = (conversation: IConversation, message: string, attachment?: IAttachment) => {
  const replyRequest = useMessageStore.getState().replyRequest;

  return createMessageTemplate(conversation, {
    message,
    attachment,
    replyRequest,
  });
};

export const regenerateMessageTemplate = (conversation: IConversation, { message, attachment }: IMessage) => {
  return createMessageTemplate(conversation, { message, attachment });
};

export function processMessagesForUser(
  messages: IMessage[] = [],
  conversation: IConversation,
  isSelectedConversation = false
) {
  const unreadMessages: IMessage[] = [];
  const imageAttachments: IImageAttachment[] = [];
  const urlAttachments: IUrlAttachment[] = [];
  const placeholders: IMessage[] = [];
  const newMessages: IMessage[] = [];
  const userReadReceipt = conversation.readReceipt?.[conversation.userId];

  if (!messages || messages.length === 0) {
    return {
      unreadMessages,
      imageAttachments: [],
      urlAttachments,
      messages,
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

    const { imageAttachment, urlAttachment } = parseAttachments(message);

    if (imageAttachment) {
      imageAttachment.senderId = message.from;
      imageAttachments.push(imageAttachment);
    }

    if (urlAttachment) urlAttachments.push(urlAttachment);

    if (!isSelectedConversation && conversation.readReceipt && message.from !== conversation.userId) {
      if (
        message.timestamp > (userReadReceipt?.lastReadMessageTimestamp || 0) 
      ) {
        unreadMessages.push(message);
      }
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

const { setMediaStore } = useAttachments.getState();
const { setMessageStore, setUnreadMessages, updateUserMessages } = useMessageStore.getState();

export function registerMessages({
  messages: _messages,
  conversationId: userConversationId,
  isSelectedConversation = false,
}: {
  messages: IMessage[];
  conversationId: string;
  isSelectedConversation?: boolean;
}) {
  let conversation = getConversationByConversationId(userConversationId);

  if (!conversation) return;

  const conversationId = conversation.id;

  const { unreadMessages, messages, imageAttachments, urlAttachments, placeholders } = processMessagesForUser(
    _messages,
    conversation,
    isSelectedConversation
  );

  const mediaStore = { images: imageAttachments, link: urlAttachments };
  const recentMessage = _messages.at(-1);

  if (!!placeholders?.length) updateUserMessages(conversationId, placeholders);
  if (!!messages.length) setMessageStore(conversationId, messages);
  setMediaStore(conversationId, mediaStore);
  setUnreadMessages(conversationId, unreadMessages);

  return { conversation, recentMessage };
}

export function parseAttachments(message: IMessage) {
  if (message.attachment) {
    let attachment = message.attachment;

    if (attachment.type === "images") {
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
