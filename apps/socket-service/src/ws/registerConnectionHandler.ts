import { Namespace, Server } from "socket.io";
import handleDisconnection from "./handleDisconnection";
import registerGroupHandlers from "./registerGroupHandlers";
import registerMessageHandlers from "./registerMessageHandlers";
import registerUserHandlers from "./registerUserHandlers";
import registerConversationHandlers from "./registerConversationHandlers";
import registerSessionHandler from "./registerSessionHandler";
import { ISocket } from "../interfaces/socketInterfaces";

export async function onConnection(io: Server, socket: ISocket) {
  console.log(`Socket ${socket.id} connected to ${process.pid}`);

  // --- Side effects moved from middleware ---
  const { channels, session } = socket.handshake.auth;

  // Join user's personal room (for targeted emits)
  if (socket.userId) {
    socket.join(socket.userId);
  }

  // Join channel rooms (group conversations)
  const channelList: string[] = channels || [];

  if (channelList.length > 0) {
    channelList.forEach((channel) => socket.join(channel));
  }

  // Notify other sessions about this connection
  if (socket.userId && session) {
    io.to(socket.userId).emit("SAVE_SESSION", session);
  }
  // --- End moved side effects ---

  registerSessionHandler(io, socket);

  registerUserHandlers(io, socket);

  registerConversationHandlers(io, socket);

  registerMessageHandlers(io, socket);

  registerGroupHandlers(io, socket);

  handleDisconnection(io, socket);
}
