import { IConversation } from "@interfaces/conversationInterface";
import { IMessage } from "@interfaces/messageInterface";
import { ISocket } from "@lib/ws";
import { GenerateConversationProps } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";

export function initConversationEmiters(socket: ISocket, user: IUser) {
  return {
    sendConversationActivationRequest: (conversationId: string) => {
      socket.emit("ACTIVATE_CONVERSATION", conversationId);
    },
    sendRequestToRegisterStarredMessage: (req: {
      conversationId: string;
      message: IMessage;
      host: "user" | "group" | "ai";
    }) => {
      socket.emit("REGISTER_STARRED_MESSAGES", req);
    },

    sendRequestToUnRegisterStarredMessage: (req: {
      conversationId: string;
      message: IMessage;
      host: "user" | "group" | "ai";
    }) => {
      socket.emit("UNREGISTER_STARRED_MESSAGES", req);
    },

    sendRequestToRegisterConversation: (
      members: { currentUser: IUser; participant: IUser },
      props?: GenerateConversationProps
    ) => {
      socket.emit("REGISTER_CONVERSATION", members, props);
    },

    sendRequestToArchiveConversation: (conversation: IConversation) => {
      socket.emit("ARCHIVE_CONVERSATION", conversation);
    },

    sendRequestToUnarchiveConversation: (conversation: IConversation) => {
      socket.emit("UNARCHIVE_CONVERSATION", conversation);
    },

    sendRequestToClearUserConversation: (id: string) => {
      socket.emit("CLEAR_CONVERSATION", id);
    },

    sendConversationDeleteRequest: (conversationId: string) => {
      socket.emit("DELETE_CONVERSATION", conversationId);
    },
  };
}
