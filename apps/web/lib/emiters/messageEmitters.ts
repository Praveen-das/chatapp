import { IConversation } from "@interfaces/conversationInterface";
import { IMessage } from "@interfaces/messageInterface";
import { ISocket } from "@lib/ws";
import { IDeleteRequest, IDeleteForUserRequest } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { useStore } from "store/global";
import { useE2eeStore } from "store/e2eStore";
import { encryptMessage } from "@lib/e2e";
import { IUpdates, MessageReadReceipt, IReencryptRequest, IReencryptResponse } from "@repo/interfaces/messageInterface";

const deleteUserMessages = useMessageStore.getState().deleteUserMessages;

export function messageEmitters(socket: ISocket) {
  return {
    sendMessage: async ({
      conversation,
      messages,
      replacePlaceholder,
    }: {
      conversation: IConversation;
      messages: IMessage[];
      replacePlaceholder?: boolean;
    }) =>
      await new Promise(async (resolve, reject) => {
        if (conversation.host === "system") return;
        let conversationId = conversation.conversationId!;
        let receivers;

        const myPrivateKey = useE2eeStore.getState().myPrivateKeyJwk;
        const encryptionPromises = messages.map(async (m) => {
          if (m.message && conversation.host === "user" && myPrivateKey) {
            const receiverId = conversation.members.find((member) => member.userId !== conversation.userId)?.userId;
            const receiver = receiverId ? useStore.getState().users.get(receiverId) : null;

            if (receiver?.publicKey) {
              m.message = await encryptMessage(m.message, receiver.publicKey, myPrivateKey);
            }
          }
        });

        await Promise.all(encryptionPromises);

        if (conversation.host === "user") {
          if (conversation.blockedByUser) {
            receivers = [];
            messages = messages.map((m) => ({ ...m, to: "" }));
          } else {
            receivers = conversation?.members.map(({ userId }) => userId);
          }
        } else if (conversation.host === "group") receivers = conversation.channelId;

        // if (!conversation.active) {
        //   socket.emit("ACTIVATE_CONVERSATION", conversation.id);
        //   updateConversation(conversation.id, { active: true });
        // }

        // const recentMessage = messages.at(-1)!;

        // updateConversation(conversation?.id!, {
        //   recentMessage,
        //   updatedAt: recentMessage.timestamp,
        // });

        socket.emit(
          "message",
          {
            messages,
            conversationId,
            to: receivers,
            replacePlaceholder,
          },
          (result: any, error: Error) => {
            if (error) return reject(error);
            resolve(result);
          },
        );
      }),

    deleteMessageForAll: (updates: IDeleteRequest) => {
      socket.emit("request:delete_message", updates);
    },

    deleteMessagesForUser: (req: IDeleteForUserRequest) => {
      socket.emit("request:delete_message_for_user", req, ({ conversationId, collection }: IDeleteForUserRequest) => {
        const id = useConversationStore
          .getState()
          .conversations.find((c) => c.host === "system" || c.conversationId === conversationId)?.id!;

        deleteUserMessages(id, collection);
      });
    },

    sendReadReceiptChangeRequest: (readReceipts: MessageReadReceipt[]) => {
      socket.emit("change readReceipt", readReceipts);
      readReceipts.forEach(useConversationStore.getState().conversationActions.updateReadReceipt);
    },

    requestReencrypt: (request: IReencryptRequest) => {
      socket.emit("REQUEST_REENCRYPT", request);
    },

    respondReencrypt: (response: IReencryptResponse) => {
      socket.emit("REENCRYPT_RESPONSE", response);
    },
  };
}
