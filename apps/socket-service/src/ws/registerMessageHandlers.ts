import { Server } from "socket.io";
import produceMessage from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import { IMessage } from "@repo/interfaces/messageInterface";
import { IDeleteForUserRequest, IDeleteRequest } from "@repo/interfaces/conversationInterface";

type RegisterMessageHandlers = {
  messages: IMessage[];
  conversationId: string;
  to: string[] | string;
  replacePlaceholder: boolean;
};

export default function registerMessageHandlers(io: Server, socket: ISocket) {
  socket.on(
    "message",
    async ({ messages, conversationId, to, replacePlaceholder }: RegisterMessageHandlers, callback) => {
      if (replacePlaceholder) {
        const messagesWithoutPlaceholder = messages.map((m) => ({ ...m, type: "message" }));

        io.to(to).except(socket.userId!).emit("message receive", {
          messages: messagesWithoutPlaceholder,
          conversationId,
        });

        io.to(socket.userId!).emit("message receive", {
          messages,
          conversationId,
        });

        callback();

        produceMessage({ messages: messagesWithoutPlaceholder }, "MESSAGES");
      } else {
        io.to(to).emit("message receive", {
          messages,
          conversationId,
        });

        produceMessage({ messages }, "MESSAGES");
      }
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

    if (conversation.host !== "system") {
      const receivers = conversation.members.map((m) => m.id);

      io.to(receivers).emit("request:delete_message", {
        conversationId: conversation.conversationId,
        messages,
      });
    }

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
