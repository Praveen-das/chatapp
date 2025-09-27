import { Namespace, Server } from "socket.io";
import produceMessage from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import { IMessage } from "@repo/interfaces/messageInterface";

export default function registerConversationHandlers(io: Server, socket: ISocket) {
  socket.on("REGISTER_CONVERSATION", (conversation: INewConversation) => {
    const members = conversation.members.map(({ id }) => id);
    produceMessage({ conversation: { ...conversation, members } }, "CREATE_CONVERSATION");
  });

  socket.on("REGISTER_USER_CONVERSATION", (conversations: IUserConversation[]) => {
    const userConversations: any[] = [];

    conversations.forEach((conversation) => {
      let members = conversation.members.map(({ id }) => id);

      userConversations.push({ ...conversation, members });

      io.to(conversation.userId).emit("CREATE_USER_CONVERSATION", conversation, conversation.userId === socket.userId);
    });

    produceMessage({ userConversations }, "CREATE_USER_CONVERSATION");
  });

  socket.on("CLEAR_CONVERSATION", (id: string) => {
    const req = { id, updates: { deletedAt: Date.now() } };

    io.to(socket.userId!).emit("CLEAR_CONVERSATION", id);
    produceMessage(req, "UPDATE_USER_CONVERSATION");
  });

  socket.on("CLEAR_GROUP_CONVERSATION", (id: string) => {
    const req = { id, updates: { deletedAt: Date.now() } };

    io.to(socket.userId!).emit("CLEAR_CONVERSATION", id);
    produceMessage(req, "UPDATE_GROUP_CONVERSATION");
  });

  socket.on("DELETE_CONVERSATION", (id: string) => {
    const req = {
      id,
      updates: { active: false, deletedAt: Date.now(), archived: false },
    };

    io.to(socket.userId!).emit("DELETE_CONVERSATION", id);

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

    io.to(socket.userId!).emit("UPDATE_CONVERSATION", id, { archived: true });
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
    async ({ message, conversationId, ...rest }: { message: IMessage; conversationId: string }) => {
      io.to(socket.userId!).emit("REGISTER_STARRED_MESSAGES", conversationId, message, "add");

      const req = {
        messageId: message.id,
        conversationId,
        ...rest,
      };

      produceMessage(req, "REGISTER_STARRED_MESSAGES");
    }
  );

  socket.on(
    "UNREGISTER_STARRED_MESSAGES",
    async ({ message, conversationId, ...rest }: { conversationId: string; message: IMessage }) => {
      io.to(socket.userId!).emit("REGISTER_STARRED_MESSAGES", conversationId, message, "remove");

      const req = {
        messageId: message.id,
        conversationId,
        ...rest,
      };

      produceMessage(req, "UNREGISTER_STARRED_MESSAGES");
    }
  );
}
