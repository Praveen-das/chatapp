import { IConversation } from "@interfaces/conversationInterface";
import { useConversationStore } from "store/conversationStore";
import { APP_NAME } from "config/constants";

export function findUserConversation(userId: string) {
  const conversations = useConversationStore.getState().conversations;
  const conversation = conversations.find((c) => c.host === "user" && c.members.some((m) => m.id === userId));
  return conversation;
}

export const getParticipant = (c: IConversation) => {
  if (c?.host !== "system") return c.members.find((m) => m.id !== c.userId);
};

export const getMemberById = (c: IConversation,id:string) => {
  if (c?.host !== "system") return c?.members.find((m) => m.id === id);
};

export const getConversationByConversationId = (conversationId: string) => {
  return useConversationStore.getState().conversations.find((c) => c.conversationId === conversationId);
};

export const getConversationById = (userConversationId: string) => {
  return useConversationStore.getState().conversations.find((c) => c.id === userConversationId);
};

export function getDisplayName(conversation: IConversation): string {
  if (conversation.host === "user") {
    const receiver = getParticipant(conversation);
    return receiver ? receiver.username : "Unknown User";
  } else if (conversation.host === "group") {
    return conversation.displayName || "Group Chat";
  } else if (conversation.host === "system") {
    return APP_NAME;
  }
  return "Unknown Conversation";
}
