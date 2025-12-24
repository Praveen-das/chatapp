import { IConversation } from "@interfaces/conversationInterface";
import { useConversationStore } from "store/conversationStore";
import { APP_NAME } from "config/constants";
import { useStore } from "store/global";
import { IGroupConversation, IMember } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { MessageReadReceipt } from "@repo/interfaces/messageInterface";
import { IMessage } from "@interfaces/messageInterface";

export function findUserConversation(userId: string) {
  const conversations = useConversationStore.getState().conversations;
  const conversation = conversations.find((c) => c.host === "user" && c.members.some((m) => m.userId === userId));
  return conversation;
}

export const getGlobalUsers = () => {
  return Array.from(useStore.getState().users.values());
};

function getConversations() {
  return useConversationStore.getState().conversations;
}

const conv = getConversations();

type ActiveUserReducerHelper = Parameters<typeof conv.reduce<IUser[]>>[0];

export const activeUserReducerHelper: ActiveUserReducerHelper = (i, c) => {
  const user = getReceiver(c);
  if (user) {
    i.push(user);
  }
  return i;
};

export const getActiveUsers = () => {
  return getConversations().reduce<IUser[]>(activeUserReducerHelper, []);
};

export const getUserFromMetadata = (meta: IMember) => {
  if (!meta) return null;
  return useStore.getState().users.get(meta.userId);
};

export const getUserById = (userId: string) => {
  if (!userId) return null;
  return useStore.getState().users.get(userId);
};

export const getReceiver = (c: IConversation) => {
  if (!c || c?.host !== "user") return null;
  const receiverMetadata = getReceiverMetadata(c);
  return getUserById(receiverMetadata?.userId!);
};

export const getReceiverMetadata = (c: IConversation) => {
  if (!c) return null;
  if (c?.host === "user") return c.members.find((m) => m.userId !== c.userId);
};

export const getMemberById = (c: IConversation, id: string) => {
  if (c?.host === "user" || c?.host === "group") return c?.members.find((m) => m.userId === id);
};

export const getConversationByConversationId = (conversationId: string) => {
  return useConversationStore.getState().conversations.find((c) => c.conversationId === conversationId);
};

export const getConversationById = (userConversationId: string) => {
  return useConversationStore.getState().conversations.find((c) => c.id === userConversationId);
};

export function getDisplayName(conversation: IConversation): string {
  if (conversation.host === "user") {
    const receiver = getReceiverMetadata(conversation);
    if (!receiver) return "";
    const user = getUserById(receiver.userId);
    return user ? user.username : "Unknown User";
  } else if (conversation.host === "group") {
    return conversation.displayName || "Group Chat";
  } else if (conversation.host === "system") {
    return APP_NAME;
  } else if (conversation.host === "ai") {
    return "AI Assistant";
  }
  return "Unknown Conversation";
}

export function getReadReceiptState(
  conversation: IConversation,
  userId: string
): Pick<MessageReadReceipt, "lastDeliveredMessageTimestamp" | "lastReadMessageTimestamp"> {
  // Calculate min values across all members except sender
  const readReceipts = conversation.readReceipt || {};

  let minDelivered = Infinity;
  let minRead = Infinity;

  if (Object.keys(readReceipts).length === 0)
    return {
      lastDeliveredMessageTimestamp: 0,
      lastReadMessageTimestamp: 0,
    };

  if (!readReceipts)
    return {
      lastDeliveredMessageTimestamp: 0,
      lastReadMessageTimestamp: 0,
    };

  for (const r of Object.values(readReceipts)) {
    if (r.userId === userId) continue;

    if (typeof r.lastDeliveredMessageTimestamp === "number") {
      minDelivered = Math.min(minDelivered, r.lastDeliveredMessageTimestamp);
    }

    if (typeof r.lastReadMessageTimestamp === "number") {
      minRead = Math.min(minRead, r.lastReadMessageTimestamp);
    }
  }

  return {
    lastDeliveredMessageTimestamp: minDelivered === Infinity ? undefined : minDelivered,
    lastReadMessageTimestamp: minRead === Infinity ? undefined : minRead,
  };
}

export function getUserReadReceiptState(conversation: IConversation, chat: IMessage) {
  const userId = chat.to;

  if (!userId) return null;

  const readReceipt = conversation.readReceipt?.[userId];

  if (!readReceipt) return null;

  const userReadReceiptState: Record<string, number> = {};

  if (readReceipt.lastReadMessageTimestamp && readReceipt.lastReadMessageTimestamp >= chat.timestamp)
    userReadReceiptState.lastReadMessageTimestamp = readReceipt.lastReadMessageTimestamp;
  if (readReceipt.lastDeliveredMessageTimestamp && readReceipt.lastDeliveredMessageTimestamp >= chat.timestamp)
    userReadReceiptState.lastDeliveredMessageTimestamp = readReceipt.lastDeliveredMessageTimestamp;

  return Object.keys(userReadReceiptState).length > 0 ? userReadReceiptState : null;
}

export function handleSettingGroupAdmin(conversation: IConversation) {
  if (conversation.host === "group") {
    conversation.members.forEach((member) => {
      member.isAdmin = conversation.admins.includes(member.userId!);
    });
  }
}

export function getGroupMember(conversation: IGroupConversation, userId: string) {
  return conversation.members.find((m) => m.userId === userId);
}
