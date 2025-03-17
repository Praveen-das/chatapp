import useAuth from "@hooks/useAuth";
import { IConversation, INewConversation } from "@interfaces/conversationInterface";
import {
  IAttachment,
  IImageAttachment,
  IMessage,
  IReadReceipt,
  IReadReceiptUpdatesCollection,
  IUnreadMessageMeta,
  IUpdatesCollection,
  IUrlAttachment,
} from "@interfaces/messageInterface";
import ObjectID from "bson-objectid";
import { IMessageReadReceipt } from "enums/enums";
import { useMessageStore } from "store/messageStore";
import { encrypt } from "./e2e";
import { IUser } from "@interfaces/userInterface";
import { useStore } from "store/global";
import { getReceiver } from "./conversation";

const createMessageTemplate = (
  conversation: IConversation | INewConversation,
  messageData: {
    message: string;
    attachment?: IAttachment | null;
    replyRequest?: IMessage["reply"] | null;
  }
): IMessage => {
  const user = useAuth.getState().user;

  const host = conversation.host;
  const conversationId = (conversation as IConversation).conversationId || conversation?.id;
  const from = user?.id;
  const to = host === "group" ? conversation?.channelId! : getReceiver(conversation as IConversation)?.id!;

  const readReceipt = conversation.members
    .filter((member) => member.id !== user?.id)
    .map((member) => ({
      userId: member.id,
      status: IMessageReadReceipt.sent,
    }));

  return {
    id: new ObjectID().toHexString(),
    from,
    to,
    conversationId,
    message: messageData.message,
    attachment: messageData.attachment,
    reply: messageData.replyRequest!,
    timestamp: Date.now(),
    readReceipt,
    deleted: false,
    user: conversation.host === "group" ? user! : undefined,
  };
};

export const generateMessageTemplate = (
  conversation: IConversation | INewConversation,
  message: string,
  attachment?: IAttachment
) => {
  const replyRequest = useMessageStore.getState().replyRequest;
  const encryptedMessage = message ? encrypt(message) : message;

  return createMessageTemplate(conversation, {
    message: encryptedMessage,
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

export function processMessagesForUser(user: IUser, status: IMessageReadReceipt, messages: IMessage[] = []) {
  const users = useStore.getState().users;
  const updates: { key: any; value: any }[] = [];
  const unreadMessages: IMessage[] = [];
  const imageAttachments: IImageAttachment[] = [];
  const urlAttachments: IUrlAttachment[] = [];
  const placeholders: IMessage[] = [];
  const newMessages: IMessage[] = [];

  if (!messages || messages.length === 0) {
    return {
      updates,
      unreadMessages,
      imageAttachments: [],
      urlAttachments,
      messages,
    };
  }

  for (let message of messages) {
    message.user = users.find((u) => u.id === message.from);

    if (message.isPlaceholder) {
      message.isPlaceholder = false;
      placeholders.push(message);
    } else newMessages.push(message);

    if (message.attachment) {
      let attachment = message.attachment;

      if (attachment.type === "images") {
        attachment.sender = message.from;
        imageAttachments.push(attachment);
      }

      if (attachment.type === "link") urlAttachments.push(attachment);
    }

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

          updates.push({ key, value: update });
        }

        if (readReceipt?.status < IMessageReadReceipt.seen) {
          unreadMessages.push(message);
        }
      }
    });
  }

  return {
    updates,
    unreadMessages,
    imageAttachments,
    urlAttachments,
    messages: newMessages,
    placeholders,
  };
}
