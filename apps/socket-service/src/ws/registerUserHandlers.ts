import { Namespace, Server } from "socket.io";
import produceMessage from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import { IUpdateBlockReq, IUserBlockRequest } from "@repo/interfaces/conversationInterface";
import { IUserRuleChangeRequest } from "@repo/interfaces/userInterface";

export default async function registerUserHandlers(io: Server, socket: ISocket) {
  io.emit("user connected", { userId: socket.userId });

  produceMessage({ id: socket.userId, updates: { status: "online", lastSeen: Date.now() } }, "UPDATE_USER");

  socket.on(
    "UPDATE_USER_BLOCK_STATUS",
    ({ userConversation, conversation, userConversations, value }: { value: boolean } & IUserBlockRequest) => {
      if (!!userConversations?.length) {
        const members: string[] = [];

        userConversations.forEach((c) => {
          members.push(c.userId);
          io.to(c.userId).emit("CREATE_USER_CONVERSATION", c);
        });

        produceMessage({ userConversations }, "CREATE_USER_CONVERSATION");
        produceMessage({ ...conversation, members }, "CREATE_CONVERSATION");
        return;
      }

      if (userConversation) {
        const req: Partial<IUpdateBlockReq> = {
          conversationId: userConversation.conversationId,
          value,
        };

        userConversation.members.forEach(({ id }) => {
          if (id === socket.userId) req["requestedUserId"] = id;
          else req["userId"] = id;
        });

        io.to(req.userId as string).emit("UPDATE_USER_BLOCK_STATUS", req.conversationId, {
          blockedByUser: value,
        });

        socket.emit("UPDATE_USER_BLOCK_STATUS", req.conversationId, {
          blocked: value,
        });

        produceMessage(req, "UPDATE_USER_BLOCK_STATUS");
      }
    }
  );

  socket.on("UPDATE_USER", (req: IUserUpdateRequest) => {
    const body = {
      id: req.userId,
      updates: req.updates,
    };

    produceMessage(body, "UPDATE_USER");
  });

  socket.on("UPDATE_USER_RULE", (req: IUserRuleChangeRequest, channels: string[], callback) => {
    const body = {
      id: req.userId,
      updates: req.updates,
    };

    callback(req);

    produceMessage(body, "UPDATE_USER");
  });
}
