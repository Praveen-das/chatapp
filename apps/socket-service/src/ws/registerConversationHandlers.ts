import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import produceMessage from "../kafka/kafka";
import axiosClient from "../lib/axiosClient";

export default function registerConversationHandlers(
  io: Server,
  socket: ISocket
) {
  socket.on("REGISTER_CONVERSATION", (conversation: INewConversation) => {
    produceMessage({ conversation }, "CREATE_CONVERSATION");
  });

  socket.on(
    "REGISTER_USER_CONVERSATION",
    (conversations: IUserConversation[]) => {
      const conversation = conversations.find(
        (c) => c.userId !== socket.userId
      );

      io.to(conversation?.userId!).emit(
        "CREATE_USER_CONVERSATION",
        conversation
      );
      produceMessage(
        { userConversations: conversations },
        "CREATE_USER_CONVERSATION"
      );
    }
  );

  socket.on("CLEAR_CONVERSATION", (id: string) => {
    const req = { id, updates: { deletedAt: Date.now() } };
    produceMessage(req, "UPDATE_USER_CONVERSATION");
  });

  socket.on("CLEAR_GROUP_CONVERSATION", (id: string) => {
    const req = { id, updates: { deletedAt: Date.now() } };
    produceMessage(req, "UPDATE_GROUP_CONVERSATION");
  });

  socket.on("DELETE_CONVERSATION", (id: string) => {
    const req = {
      id,
      updates: { active: false, deletedAt: Date.now(), archived: false },
    };

    produceMessage(req, "UPDATE_USER_CONVERSATION");
  });

  socket.on("ACTIVATE_CONVERSATION", (id: string) => {
    const req = { id, updates: { active: true } };

    produceMessage(req, "UPDATE_USER_CONVERSATION");
  });

  socket.on("ARCHIVE_CONVERSATION", async (conversation: IConversation) => {
    const id = conversation.id;
    const req = { id, updates: { archived: true } };

    conversation.host === "group"
      ? produceMessage(req, "UPDATE_GROUP_CONVERSATION")
      : produceMessage(req, "UPDATE_USER_CONVERSATION");

    socket.emit("UPDATE_CONVERSATION", id, { archived: true });
  });

  socket.on("UNARCHIVE_CONVERSATION", async (conversation: IConversation) => {
    const id = conversation.id;
    const req = { id, updates: { archived: false } };

    conversation.host === "group"
      ? produceMessage(req, "UPDATE_GROUP_CONVERSATION")
      : produceMessage(req, "UPDATE_USER_CONVERSATION");

    socket.emit("UPDATE_CONVERSATION", id, { archived: false });
  });

  socket.on(
    "REGISTER_STARRED_MESSAGES",
    async (req: { conversationId: string; messageIds: string[] }) => {
      produceMessage(req, "REGISTER_STARRED_MESSAGES");
    }
  );

  socket.on(
    "UNREGISTER_STARRED_MESSAGES",
    async (req: { conversationId: string; messageIds: string[] }) => {
      produceMessage(req, "UNREGISTER_STARRED_MESSAGES");
    }
  );
  
}
