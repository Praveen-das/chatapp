import { Server, Socket } from "socket.io";

import client from "../redis/client";

interface ISocket extends Socket {
  user?: {
    id: string;
    username: string;
  };
  sessionId?: string;
  userId?: string;
  username?: string;
}

export default async function mainAuthMiddleware(socket: ISocket, io: Server, next: any) {
  const auth = socket.handshake.auth;
  const userId = auth.userId;
  const session = auth.session;
  const channels: string[] = auth.channels || [];

  if (userId) {
    socket.userId = userId;
    socket.join(userId);

    if (!!channels.length) {
      channels.forEach((channel) => socket.join(channel));
    }

    io.to(userId).emit("SAVE_SESSION", session);

    return next();
  }

  return next(new Error("Not authorized"));
}
