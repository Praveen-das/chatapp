import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import { getConversations } from "../services/getConversations";
import produceMessage from "../kafka/kafka";
import axiosClient from "../lib/axiosClient";

export default async function registerUserHandlers(
  io: Server,
  socket: ISocket
) {
  socket.join(socket.userId!);

  try {
    const conversations = await getConversations(socket);

    socket.emit("conversations", conversations);
  } catch (error) {
    console.log("🚀 ~ registerUserHandlers ~ error:", error);
  }

  io.emit("user connected", { userId: socket.userId });

  produceMessage(
    { id: socket.userId, updates: { status: "online", lastSeen: Date.now() } },
    "UPDATE_USER"
  );

  socket.on("REQUEST:BLOCK_USER", (req: IBlocked) => {
    let { id, user, blockedUser } = req;
    let to = [user.id, blockedUser.id];

    let body: IUBlockReq = {
      id,
      userId: user.id,
      blockedId: blockedUser.id,
    };

    io.to(to).emit("RESPONSE:BLOCK_USER", req);
    axiosClient.post("/user/block", body);
  });

  socket.on("REQUEST:UNBLOCK_USER", (req: IBlocked) => {
    let { id, user, blockedUser } = req;
    let to = [user.id, blockedUser.id];

    io.to(to).emit("RESPONSE:UNBLOCK_USER", req);
    axiosClient.delete(`/user/unblock/${id}`);
  });

  socket.on("updateUser", (req: IUserUpdateRequest) => {
    const body = {
      id: req.userId,
      updates: req.updates,
    };

    produceMessage(body, "UPDATE_USER");
  });

  socket.on("updateUserRule", (req: IUserRuleChangeRequest) => {
    let key = Object.keys(req.rules)[0];

    let value = req.rules[key as keyof typeof req.rules].isVisible;

    const body = {
      id: req.userId,
      updates: { [`rules.${key}.isVisible`]: value },
    };

    io.emit("updateUserRule", req);

    produceMessage(body, "UPDATE_USER");
  });
}
