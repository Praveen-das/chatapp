import { Server } from "socket.io";
import produceMessage from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import { IUserBlockRequest } from "@repo/interfaces/conversationInterface";
import { IUserRuleChangeRequest } from "@repo/interfaces/userInterface";

export default async function registerUserHandlers(io: Server, socket: ISocket) {
  // produceMessage({ id: socket.userId, updates: { status: "online", lastSeen: Date.now() } }, "UPDATE_USER");

  socket.on("USER_CONNECTED", async (to: string[], session: any) => {
    io.to(socket.userId!).emit("SAVE_SESSION", session);
    io.to(to).emit("USER_CONNECTED", { userId: socket.userId });
  });

  socket.on("UPDATE_USER_BLOCK_STATUS", ({ conversationId, blocked, blockedId }: IUserBlockRequest) => {
    const req = {
          conversationId,
          blocked,
          blockedList: [{ userId: blockedId, blockedBy: socket.userId }],
          blockedId,
        };

    io.to(blockedId!).emit("UPDATE_USER_BLOCK_STATUS", conversationId, {
      blockedByUser: blocked,
    });
    
    io.to(socket.userId!).emit("UPDATE_USER_BLOCK_STATUS", conversationId, {
      blocked,
    });

    produceMessage(req, "UPDATE_USER_BLOCK_STATUS");
  });

  socket.on("UPDATE_USER", (req: IUserUpdateRequest) => {
    const body = {
      id: req.userId,
      updates: req.updates,
    };

    produceMessage(body, "UPDATE_USER");
  });

  socket.on("UPDATE_USER_RULE", (req: IUserRuleChangeRequest, sockets: string[]) => {
    sockets.forEach((id) => {
      io.to(id).emit("UPDATE_USER_RULE", req);
    });
    
    produceMessage(req, "UPDATE_USER_RULE");
  });
}
