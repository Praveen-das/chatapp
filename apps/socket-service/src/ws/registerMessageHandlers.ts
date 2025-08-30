import { Namespace, Server } from "socket.io";
import produceMessage from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import { IMessage } from "@repo/interfaces/messageInterface";

export default function registerMessageHandlers(io: Server, socket: ISocket) {
  socket.on(
    "message",
    async ({
      messages,
      conversationId,
      to,
    }: {
      messages: IMessage[];
      conversationId: string;
      to: string[] | string;
    }) => {
      !!to.length &&
        io.to(to).emit("message receive", {
          messages,
          conversationId,
        });

      produceMessage({ messages }, "MESSAGES");
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

  socket.on("request:delete_message", async ({ conversation, messages }: IDeleteRequest) => {
    if (!messages.length) return;

    const receivers = conversation.members.map((m) => m.id);

    io.to(receivers).emit("request:delete_message", {
      conversationId: conversation.conversationId,
      messages,
    });

    produceMessage({ messages }, "UPDATE_MESSAGES");
  });

  socket.on(
    "request:delete_message_for_user",
    async ({ conversationId, collection }: IDeleteForUserRequest, callback) => {
      if (!collection.length) return;

      callback({ conversationId, collection });

      produceMessage({ collection }, "DELETE_MESSAGE_FOR_USER");
    }
  );
}
