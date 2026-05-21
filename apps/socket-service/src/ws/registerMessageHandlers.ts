import { Server } from "socket.io";
import { produceMessage, createEnvelope, KAFKA_TOPICS } from "../kafka/kafka";
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

        console.log({ messages })
        produceMessage(
          createEnvelope("SAVE", { messages: messagesWithoutPlaceholder }),
          KAFKA_TOPICS.MESSAGES,
          conversationId
        );
      } else {
        io.to(to).emit("message receive", {
          messages,
          conversationId,
        });


        try {
          produceMessage(
            createEnvelope("SAVE", { messages }),
            KAFKA_TOPICS.MESSAGES,
            conversationId
          );
        } catch (error) {
          console.log((error as Error).message)
        }
      }

      callback();
    }
  );

  socket.on("change readReceipt", async (updates: MessageReadReceipt[]) => {
    if (!updates) return;
    updates.forEach((rr) => {
      io.to(rr.senderId).emit("change readReceipt", rr);
    });

    produceMessage(
      createEnvelope("UPDATE_READ_RECEIPTS", { readReceipts: updates }),
      KAFKA_TOPICS.CONVERSATIONS
    );
  });

  socket.on("request:delete_message", async ({ conversation, messages }: IDeleteRequest) => {
    if (!messages.length) return;
    if (conversation.host === "system") return;
    if (conversation.host === "ai") return;

    const receivers = conversation.members.map((m) => m.userId);

    io.to(receivers).emit("request:delete_message", {
      conversationId: conversation.conversationId,
      messages,
    });

    produceMessage(
      createEnvelope("UPDATE_MESSAGES", { messages }),
      KAFKA_TOPICS.MESSAGES,
      conversation.conversationId
    );
  });

  socket.on(
    "request:delete_message_for_user",
    async ({ conversationId, collection }: IDeleteForUserRequest, callback) => {
      if (!collection.length) return;

      callback({ conversationId, collection });

      produceMessage(
        createEnvelope("DELETE_MESSAGE_FOR_USER", { collection }),
        KAFKA_TOPICS.MESSAGES,
        conversationId
      );
    }
  );
}
