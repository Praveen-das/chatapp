import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import produceMessage from "../kafka/kafka";

export default function registerMessageHandlers(io: Server, socket: ISocket) {
  socket.on(
    "message",
    async ({
      messages,
      conversation,
    }: {
      messages: IMessage[];
      conversation: IConversation;
    }) => {
      let receiver =
        conversation.host === "group"
          ? conversation.channelId
          : conversation.members?.find((m) => m.id !== socket.userId)?.id;

      if (conversation.host === "user")
        produceMessage({ messages, conversation });
      else produceMessage({ messages });
      
      io.to(receiver!)
        .except(socket.userId!)
        .emit("message receive", { messages, conversation });
    }
  );

  socket.on("change readReceipt", async (_updates: IUpdates) => {
    const updates = new Map(_updates);
    if (!updates.size) return;

    updates.forEach((values, { to, conversationId }) => {
      io.to(to).emit("change readReceipt", { conversationId, updates: values });
      produceMessage({ messages: values }, "UPDATE_MESSAGES");
    });
  });

  socket.on(
    "request:delete_message",
    async ({ conversation, messages }: IDeleteRequest) => {
      if (!messages.length) return;

      const receivers = conversation.members.map((m) => m.id);

      io.to(receivers).emit("request:delete_message", {
        conversationId: conversation.id,
        messages,
      });

      produceMessage({ messages }, "UPDATE_MESSAGES");
    }
  );

  socket.on(
    "request:delete_message_for_user",
    async ({ conversationId, collection }: IDeleteForUserRequest) => {
      if (!collection.length) return;

      socket.emit("request:delete_message_for_user", {
        conversationId,
        collection,
      });

      produceMessage({ collection }, "DELETE_MESSAGE_FOR_USER");
    }
  );
}
