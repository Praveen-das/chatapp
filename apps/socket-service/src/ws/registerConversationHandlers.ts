import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import produceMessage from "../kafka/kafka";
import axiosClient from "../lib/axiosClient";

export default function registerConversationHandlers(
  io: Server,
  socket: ISocket
) {
  socket.on("CLEAR_CONVERSATION", (req: IClearConversationRequest) => {
    produceMessage(req, "CLEAR_CONVERSATION_FOR_USER");
  });

  socket.on("CLEAR_GROUP_CONVERSATION", (req: IClearConversationRequest) => {
    produceMessage(req, "CLEAR_GROUP_CONVERSATION_FOR_USER");
  });

  socket.on(
    "DELETE_CONVERSATION",
    ({ conversation, ...rest }: IClearConversationRequest) => {
      const members = conversation.members.map(({ id }) => id);
      const req = { ...rest, conversationId: conversation.id };

      io.to(members).emit("DELETE_CONVERSATION", req);

      produceMessage(req, "CLEAR_CONVERSATION_FOR_USER");
    }
  );

  socket.on("ARCHIVE_CONVERSATION", async (conversationId: string) => {
    await axiosClient.post("/archive/add", {
      conversationId,
      userId: socket.userId,
    });
    
    socket.emit("UPDATE_CONVERSATION", conversationId, {
      isArchived: true,
    });
  });

  socket.on("UNARCHIVE_CONVERSATION", async (conversationId: string) => {
    await axiosClient.post("/archive/remove", {
      conversationId,
      userId: socket.userId,
    });

    socket.emit("UPDATE_CONVERSATION", conversationId, {
      isArchived: false,
    });
  });
}
