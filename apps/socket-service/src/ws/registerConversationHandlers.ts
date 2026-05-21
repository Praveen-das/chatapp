import { Server } from "socket.io";
import { produceMessage, createEnvelope, KAFKA_TOPICS } from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import { IMessage } from "@repo/interfaces/messageInterface";
import { GroupClearReq } from "@repo/interfaces/groupInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { handleGeneratingConversation } from "@repo/utils";

export default function registerConversationHandlers(io: Server, socket: ISocket) {
  socket.on(
    "REGISTER_CONVERSATION",
    ({ currentUser, participant }: { currentUser: IUser; participant: IUser }, props: any) => {
      
      const { conversation, userConversations, participants } = handleGeneratingConversation(
        [currentUser, participant],
        props
      );

      userConversations.forEach((userConversation) => {
        let self = userConversation.userId === socket.userId;

        io.to(userConversation.userId).emit(
          "CREATE_USER_CONVERSATION",
          userConversation,
          self ? participant : currentUser,
          self
        );
      });

      produceMessage(
        createEnvelope("CREATE_CONVERSATION", { conversation, participants, userConversations }),
        KAFKA_TOPICS.CONVERSATIONS,
        conversation.id?.toString()
      );
    }
  );

  // socket.on("REGISTER_USER_CONVERSATION", (conversations: IUserConversation[]) => {
  //   const userConversations: any[] = [];

  //   conversations.forEach((conversation) => {
  //     let members = conversation.members.map(({ id }) => id);

  //     userConversations.push({ ...conversation, members });

  //     io.to(conversation.userId).emit("CREATE_USER_CONVERSATION", conversation, conversation.userId === socket.userId);
  //   });

  //   produceMessage({ userConversations }, "CREATE_USER_CONVERSATION");
  // });

  socket.on("CLEAR_CONVERSATION", (id: string) => {
    const req = { id, updates: { deletedAt: Date.now() } };

    io.to(socket.userId!).emit("CLEAR_CONVERSATION", id);
    produceMessage(
      createEnvelope("UPDATE_USER_CONVERSATION", req),
      KAFKA_TOPICS.CONVERSATIONS,
      id
    );
  });

  socket.on("CLEAR_GROUP_CONVERSATION", (req: GroupClearReq) => {
    io.to(socket.userId!).emit("CLEAR_CONVERSATION", req.conversationId);
    produceMessage(
      createEnvelope("CLEAR_GROUP_CONVERSATION_FOR_USER", req),
      KAFKA_TOPICS.GROUPS,
      req.conversationId
    );
  });

  socket.on("DELETE_CONVERSATION", (id: string) => {
    const req = {
      id,
      updates: { active: false, deletedAt: Date.now(), archived: false },
    };

    io.to(socket.userId!).emit("DELETE_CONVERSATION", id);

    produceMessage(
      createEnvelope("UPDATE_USER_CONVERSATION", req),
      KAFKA_TOPICS.CONVERSATIONS,
      id
    );
  });

  socket.on("ACTIVATE_CONVERSATION", (id: string) => {
    const req = { id, updates: { active: true } };

    produceMessage(
      createEnvelope("UPDATE_USER_CONVERSATION", req),
      KAFKA_TOPICS.CONVERSATIONS,
      id
    );
  });

  socket.on("ARCHIVE_CONVERSATION", async (conversation: IConversation) => {
    const id = conversation.id;
    const req = { id, updates: { archived: true } };

    if (conversation.host === "group") {
      produceMessage(
        createEnvelope("UPDATE_GROUP_CONVERSATION", req),
        KAFKA_TOPICS.CONVERSATIONS,
        id
      );
    } else {
      produceMessage(
        createEnvelope("UPDATE_USER_CONVERSATION", req),
        KAFKA_TOPICS.CONVERSATIONS,
        id
      );
    }

    io.to(socket.userId!).emit("UPDATE_CONVERSATION", id, { archived: true });
  });

  socket.on("UNARCHIVE_CONVERSATION", async (conversation: IConversation) => {
    const id = conversation.id;
    const req = { id, updates: { archived: false } };

    if (conversation.host === "group") {
      produceMessage(
        createEnvelope("UPDATE_GROUP_CONVERSATION", req),
        KAFKA_TOPICS.CONVERSATIONS,
        id
      );
    } else {
      produceMessage(
        createEnvelope("UPDATE_USER_CONVERSATION", req),
        KAFKA_TOPICS.CONVERSATIONS,
        id
      );
    }

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

      produceMessage(
        createEnvelope("REGISTER_STARRED_MESSAGES", req),
        KAFKA_TOPICS.CONVERSATIONS,
        conversationId
      );
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

      produceMessage(
        createEnvelope("UNREGISTER_STARRED_MESSAGES", req),
        KAFKA_TOPICS.CONVERSATIONS,
        conversationId
      );
    }
  );
}
