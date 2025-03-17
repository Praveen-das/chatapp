import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import produceMessage from "../kafka/kafka";
import { Types } from "mongoose";

export default async function registerUserHandlers(io: Server, socket: ISocket) {
  io.emit("user connected", { userId: socket.userId });

  produceMessage({ id: socket.userId, updates: { status: "online", lastSeen: Date.now() } }, "UPDATE_USER");

  socket.on("UPDATE_USER_BLOCK_STATUS", (conversation: IUserConversation, value: boolean, create: boolean) => {
    if (create) {
      const userConversations: any[] = [];

      conversation.members.forEach((member) => {
        const userConversation = {
          id: new Types.ObjectId().toHexString(),
          userId: member.id,
          conversationId: conversation.id,
          members: conversation.members,
          host: "user",
          active: true,

          blocked: member.id === socket.userId,
          blockedByUser: member.id !== socket.userId,

          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        userConversations.push(userConversation);
        io.to(member.id).emit("CREATE_USER_CONVERSATION", userConversation);
      });

      produceMessage({ userConversations }, "CREATE_USER_CONVERSATION");
      produceMessage({ conversation }, "CREATE_CONVERSATION");
      return;
    }

    const req: Partial<IUpdateBlockReq> = {
      conversationId: conversation.conversationId,
      value,
    };

    conversation.members.forEach(({ id }) => {
      if (id === socket.userId) req["requestedUserId"] = id;
      else req["userId"] = id;
    });

    io.to(req.userId!).emit("UPDATE_USER_BLOCK_STATUS", req.conversationId, {
      blockedByUser: value,
    });

    socket.emit("UPDATE_USER_BLOCK_STATUS", req.conversationId, {
      blocked: value,
    });

    produceMessage(req, "UPDATE_USER_BLOCK_STATUS");
  });

  socket.on("updateUser", (req: IUserUpdateRequest) => {
    const body = {
      id: req.userId,
      updates: req.updates,
    };

    produceMessage(body, "UPDATE_USER");
  });

  socket.on("updateUserRule", (req: IUserRuleChangeRequest, channels: string[]) => {
    let key = Object.keys(req.rules)[0];

    let value = req.rules[key as keyof typeof req.rules].isVisible;

    const body = {
      id: req.userId,
      updates: { [`rules.${key}.isVisible`]: value },
    };

    io.to(channels).emit("updateUserRule", req);

    produceMessage(body, "UPDATE_USER");
  });
}
