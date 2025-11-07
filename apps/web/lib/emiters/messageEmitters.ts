import { IConversation } from "@interfaces/conversationInterface";
import { IMessage } from "@interfaces/messageInterface";
import { ISocket } from "@lib/ws";
import { IDeleteRequest, IDeleteForUserRequest } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { encrypt } from "@lib/e2e";
import { IUpdates } from "@repo/interfaces/messageInterface";

const deleteUserMessages = useMessageStore.getState().deleteUserMessages;

export function messageEmitters(socket: ISocket) {
  return {
    sendMessage: ({
      conversation,
      messages,
      replacePlaceholder,
      callback,
    }: {
      conversation: IConversation;
      messages: IMessage[];
      replacePlaceholder?: boolean;
      callback?: () => void;
    }) => {
      if (conversation.host === "system") return;
      let conversationId = conversation.conversationId!;
      let receivers;

      messages.forEach((m) => {
        if (m.message) m.message = encrypt(m.message);
      });

      if (conversation.host === "user") {
        if (conversation.blockedByUser) {
          receivers = [];
          messages = messages.map((m) => ({ ...m, to: "" }));
        } else {
          receivers = conversation?.members.map(({ id }) => id);
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
        callback
      );
    },

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

    sendReadReceiptChangeRequest: (updates: IUpdates) => {
      socket.emit("change readReceipt", Array.from(updates));
    },
  };
}
