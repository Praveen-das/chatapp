import {
  IImageAttachment,
  IMessage,
  IUnreadMessageMeta,
  IUpdatesCollection,
  IUrlAttachment,
} from "@interfaces/messageInterface";
import { IMessageReadReceipt } from "enums/enums";

export function processMessagesForUser(
  userId: string,
  status: IMessageReadReceipt,
  messages: IMessage[]=[],
) {
  const updates: { key: any; value: any }[] = [];
  const unreadMessages: IUnreadMessageMeta[] = [];
  const imageAttachments: IImageAttachment[] = [];
  const urlAttachments: IUrlAttachment[] = [];

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
    if (message.attachment) {
      let attachment = message.attachment;

      if (attachment.type === "images") {
        attachment.sender = message.from;
        imageAttachments.push(attachment);
      }

      if (attachment.type === "link") {
        urlAttachments.push(attachment);
      }
    }

    message.readReceipt.forEach((readReceipt) => {
      if (readReceipt.userId === userId) {
        if (readReceipt?.status === IMessageReadReceipt.sent) {
          const update: IUpdatesCollection = {
            id: message.id,
            readReceipt: [{ userId, status }],
          };

          let key = {
            conversationId: message.conversationId!,
            to: message.from!,
          };

          updates.push({ key, value: update });
        }

        if (readReceipt?.status < IMessageReadReceipt.seen) {
          unreadMessages.push({ id: message.id, from: message.from! });
        }
      }
    });
  }

  // const imageAttachments = await Promise.all(imageAttachmentPromises);

  return {
    updates,
    unreadMessages,
    imageAttachments,
    urlAttachments,
    messages,
  };
}
