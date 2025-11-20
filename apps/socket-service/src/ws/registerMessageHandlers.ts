import { Server } from "socket.io";
import produceMessage from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import { IMessage, MessageReadReceipt } from "@repo/interfaces/messageInterface";
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

        produceMessage({ messages: messagesWithoutPlaceholder }, "MESSAGES");
      } else {
        io.to(to).emit("message receive", {
          messages,
          conversationId,
        });

        produceMessage({ messages }, "MESSAGES");
      }

      callback();
    }
  );

  socket.on("change readReceipt", async (updates: MessageReadReceipt[]) => {
    if (!updates) return;
    
    updates.forEach((rr) => {
      io.to(rr.senderId).emit("change readReceipt", rr);
    });

    produceMessage({ readReceipts: updates }, "UPDATE_READ_RECEIPTS");
  });

  socket.on("request:delete_message", async ({ conversation, messages }: IDeleteRequest) => {
    if (!messages.length) return;

    if (conversation.host !== "system") {
      const receivers = conversation.members.map((m) => m.userId);

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
