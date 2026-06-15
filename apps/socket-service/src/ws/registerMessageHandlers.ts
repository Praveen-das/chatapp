import { Server } from "socket.io";
import { produceMessage, createEnvelope, KAFKA_TOPICS } from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import { IMessage, MessageReadReceipt, IReencryptRequest, IReencryptResponse } from "@repo/interfaces/messageInterface";
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

        produceMessage(
          createEnvelope("SAVE", { messages: messagesWithoutPlaceholder }),
          KAFKA_TOPICS.MESSAGES,
          conversationId,
        );
      } else {
        io.to(to).emit("message receive", {
          messages,
          conversationId,
        });

        try {
          produceMessage(createEnvelope("SAVE", { messages }), KAFKA_TOPICS.MESSAGES, conversationId);
        } catch (error) {
          console.log((error as Error).message);
        }
      }

      callback();
    },
  );

  socket.on("change readReceipt", async (updates: MessageReadReceipt[]) => {
    if (!updates) return;
    updates.forEach((rr) => {
      io.to(rr.senderId).emit("change readReceipt", rr);
    });

    produceMessage(createEnvelope("UPDATE_READ_RECEIPTS", { readReceipts: updates }), KAFKA_TOPICS.CONVERSATIONS);
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

    produceMessage(createEnvelope("UPDATE_MESSAGES", { messages }), KAFKA_TOPICS.MESSAGES, conversation.conversationId);
  });

  socket.on(
    "request:delete_message_for_user",
    async ({ conversationId, collection }: IDeleteForUserRequest, callback) => {
      if (!collection.length) return;

      callback({ conversationId, collection });

      produceMessage(createEnvelope("DELETE_MESSAGE_FOR_USER", { collection }), KAFKA_TOPICS.MESSAGES, conversationId);
    },
  );

  socket.on("REQUEST_REENCRYPT", (request: IReencryptRequest) => {
    // 1. Forward request to User B's personal room
    io.to(request.targetUserId).emit("REQUEST_REENCRYPT", request);
    // 2. Persist request in DB (via Kafka action SAVE_REENCRYPT_REQUEST)
    produceMessage(createEnvelope("SAVE_REENCRYPT_REQUEST", request), KAFKA_TOPICS.MESSAGES, request.conversationId);
  });

  socket.on("REENCRYPT_RESPONSE", (response: IReencryptResponse) => {
    // 1. Forward response to User A's personal room
    io.to(response.targetUserId).emit("REENCRYPT_RESPONSE", response);

    // 2. Update messages in DB with the new ciphertexts (via Kafka action UPDATE_MESSAGES)
    const updates = response.messages.map((m) => ({
      id: m.id,
      message: m.message,
      publicKeyTimestamp: m.publicKeyTimestamp,
    }));

    produceMessage(
      createEnvelope("UPDATE_MESSAGES", { messages: updates }),
      KAFKA_TOPICS.MESSAGES,
      response.conversationId,
    );

    // 3. Resolve the pending re-encryption request in DB
    const resolvePayload = {
      requesterId: response.targetUserId,
      targetUserId: socket.userId,
      conversationId: response.conversationId,
    };

    produceMessage(
      createEnvelope("RESOLVE_REENCRYPT_REQUEST", resolvePayload),
      KAFKA_TOPICS.MESSAGES,
      response.conversationId,
    );
  });

  socket.on(
    "SAVE_FAILED_REENCRYPTIONS",
    (payload: {
      failures: {
        messageId: string;
        conversationId: string;
        requesterId: string;
        otherPublicKey?: string;
        encryptedContent: string;
        reason: string;
      }[];
    }) => {
      if (!payload.failures?.length) return;
      produceMessage(
        createEnvelope("SAVE_FAILED_REENCRYPTIONS", payload),
        KAFKA_TOPICS.MESSAGES,
        payload.failures[0]!.conversationId,
      );
    },
  );
}
