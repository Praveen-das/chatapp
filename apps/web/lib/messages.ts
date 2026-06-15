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
import { decryptMessage, E2E_WAITING_MESSAGE, resolvePublicKeyForTimestamp } from "./e2e";
import { useE2eeStore } from "store/e2eStore";
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

const createMessageTemplate = (
  conversation: IConversation,
  messageData: {
    message: string;
    messageId?: string;
    attachment?: IAttachment | null;
    replyRequest?: IMessage["reply"] | null;
  },
): IMessage => {
  const host = conversation.host;
  const conversationId = (conversation as IConversation).conversationId || conversation?.id;
  const from = conversation.userId;
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

export const generateAiMessageTemplate = (conversation: IConversation, messageId: string): IMessage => {
  const replyRequest = useMessageStore.getState().replyRequest;

  return {
    id: messageId,
    from: "ai",
    to: conversation.userId,
    conversationId: conversation.conversationId,
    message: "generating",
    type: "generating",
    timestamp: Date.now(),
    reply: replyRequest!,
    deleted: false,
  };
};

export const regenerateMessageTemplate = (conversation: IConversation, { message, attachment }: IMessage) => {
  return createMessageTemplate(conversation, { message, attachment });
};

export async function processMessagesForUser(
  messages: IMessage[] = [],
  conversation: IConversation,
  isSelectedConversation = false,
) {
  const unreadMessages: IMessage[] = [];
  const aiMessages: IMessage[] = [];
  const imageAttachments: IImageAttachment[] = [];
  const urlAttachments: IUrlAttachment[] = [];
  const placeholders: IMessage[] = [];
  const newMessages: IMessage[] = [];
  const failedDecryptionMessageIds: string[] = [];
  const userReadReceipt = conversation.readReceipt?.[conversation.userId];

  if (!messages || messages.length === 0) {
    return {
      unreadMessages,
      aiMessages,
      imageAttachments: [],
      urlAttachments,
      messages,
      failedDecryptionMessageIds,
    };
  }

  // Hoist other-user lookup outside the loop for efficiency
  const otherMember =
    conversation.host === "user" ? conversation.members.find((m) => m.userId !== conversation.userId) : null;
  const otherUser = otherMember ? useStore.getState().users.get(otherMember.userId) : null;
  const myPrivateKey = useE2eeStore.getState().myPrivateKeyJwk || undefined;

  for (let message of messages) {
    if (message.from === "system") continue;

    const isUserMessage = conversation.host === "user" || conversation.host === "group";
    const isPlaceholder = message.type === "placeholder";
    if (isUserMessage || isPlaceholder) {
      if (message?.message && message.message.startsWith("v2:") && conversation.host === "user") {
        const otherPublicKey = resolvePublicKeyForTimestamp(
          otherUser?.publicKeyHistory,
          otherUser?.publicKey,
          message.publicKeyTimestamp ?? message.timestamp,
        );

        message.message = await decryptMessage(message.message, otherPublicKey, myPrivateKey);

        if (message.message === E2E_WAITING_MESSAGE && message.from !== conversation.userId) {
          failedDecryptionMessageIds.push(message.id);
        }
      }

      if (message?.reply?.message && message.reply.message.startsWith("v2:") && conversation.host === "user") {
        const otherPublicKey = resolvePublicKeyForTimestamp(
          otherUser?.publicKeyHistory,
          otherUser?.publicKey,
          message.publicKeyTimestamp ?? message.timestamp,
        );
        message.reply.message = await decryptMessage(message.reply.message, otherPublicKey, myPrivateKey);

        if (message.reply.message === E2E_WAITING_MESSAGE && message.from !== conversation.userId) {
          failedDecryptionMessageIds.push(message.id);
        }
      }
    }

    if (isPlaceholder) {
      message.type = "message";
      placeholders.push(message);
    } else if (conversation.host === "ai") {
      aiMessages.push(message);
    } else {
      newMessages.push(message);
    }

    const { imageAttachment, urlAttachment } = parseAttachments(message);

    if (imageAttachment) {
      imageAttachment.senderId = message.from;
      imageAttachments.push(imageAttachment);
    }

    if (urlAttachment) urlAttachments.push(urlAttachment);

    if (!isSelectedConversation && message.from !== conversation.userId && conversation.host !== "ai") {
      if (message.timestamp > (userReadReceipt?.lastDeliveredMessageTimestamp || 0)) {
        unreadMessages.push(message);
      }
    }
  }

  return {
    unreadMessages,
    aiMessages,
    imageAttachments,
    urlAttachments,
    messages: newMessages,
    placeholders,
    failedDecryptionMessageIds,
  };
}

const { setMediaStore } = useAttachments.getState();
const { setMessageStore, setMessageHistory, setUnreadMessages, updateUserMessages } = useMessageStore.getState();

export async function registerMessages({
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

  const {
    unreadMessages,
    aiMessages,
    messages,
    imageAttachments,
    urlAttachments,
    placeholders,
    failedDecryptionMessageIds,
  } = await processMessagesForUser(_messages, conversation, isSelectedConversation);
  const mediaStore = { images: imageAttachments, link: urlAttachments };
  const recentMessage = _messages.at(-1);

  if (!!placeholders?.length) updateUserMessages(conversationId, placeholders);
  if (!!messages.length) setMessageStore(conversationId, messages);
  if (!!aiMessages.length) setMessageHistory(new Map().set(conversationId, aiMessages));
  setMediaStore(conversationId, mediaStore);
  setUnreadMessages(conversationId, unreadMessages);

  return { conversation, recentMessage, failedDecryptionMessageIds };
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

export function findPlaintextMessage(messageId: string, conversationId: string): string | null {
  const messageStore = useMessageStore.getState();
  // The store is keyed by user-facing conversation.id, but callers may pass the shared conversationId.
  // Resolve to the correct key via getConversationByConversationId.
  const conversation = getConversationByConversationId(conversationId);
  const storeKey = conversation?.id ?? conversationId;

  const messages = messageStore.messageStore.get(storeKey) || [];
  const history = messageStore.messageHistory.get(storeKey) || [];
  const allMessages = [...messages, ...history];
  const found = allMessages.find((m) => m.id === messageId);

  if (found && found.message && found.message !== E2E_WAITING_MESSAGE && !found.message.startsWith("v2:")) {
    return found.message;
  }
  return null;
}
