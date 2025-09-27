import { IConversation } from "@repo/interfaces/conversationInterface";
import { IMessage, IUpdates } from "@repo/interfaces/messageInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { useConversationStore } from "store/conversationStore";
import { processMessagesForUser } from "./messages";
import { IMessageReadReceipt } from "enums/enums";
import { useMessageStore } from "store/messageStore";
import { useAttachments } from "store/attachments";
import socket from "./ws";
import { useStore } from "store/global";
import { APP_NAME } from "config/constants";

export function findUserConversation(userId: string) {
  const conversations = useConversationStore.getState().conversations;
  const conversation = conversations.find((c) => c.host === "user" && c.members.some((m) => m.id === userId));
  return conversation;
}

export const getReceiver = (c: IConversation) => {
  if (c?.host === "user") return c.members.find((m) => m.id !== c.userId);
};

const { setConversation } = useConversationStore.getState().conversationActions;
const { setUnreadMessages, setMessageHistory } = useMessageStore.getState();
const { setMediaStore } = useAttachments.getState();
const { addNewUser } = useStore.getState();

export function registerConversations(conversations: IConversation[], user: IUser) {
  if (!user) return;

  const messageStore: Map<string, IMessage[]> = new Map();
  const updatesCollection: IUpdates = new Map();
  const channelIds: string[] = [];

  conversations.forEach((conversation) => {
    let conversationId = conversation.id;

    const receiver = getReceiver(conversation);
    if (receiver) addNewUser(receiver);

    const { unreadMessages, messages, imageAttachments, urlAttachments } = processMessagesForUser(
      user!,
      IMessageReadReceipt.received,
      conversation.messages,
      updatesCollection
    );

    if (conversation && conversation.host === "group") channelIds.push(conversation.channelId!);

    const mediaStore = { images: imageAttachments, link: urlAttachments };
    const recentMessage = messages?.at(-1);

    if (recentMessage) {
      conversation.recentMessage = recentMessage;
      conversation.updatedAt = recentMessage.timestamp;
    }

    messageStore.set(conversationId, messages || []);
    
    setConversation(conversation);
    setMediaStore(conversationId, mediaStore);

    !!unreadMessages.length && setUnreadMessages(conversationId, unreadMessages);

    delete conversation.messages;
  });

  // socket.auth = { userId: user?.id, channelIds };

  setMessageHistory(messageStore);

  return updatesCollection;
}

export function getDisplayName(conversation: IConversation): string {
  if (conversation.host === "user") {
    const receiver = getReceiver(conversation);
    return receiver ? receiver.username : "Unknown User";
  } else if (conversation.host === "group") {
    return conversation.displayName || "Group Chat";
  } else if (conversation.host === "system") {
    return APP_NAME;
  }
  return "Unknown Conversation";
}
