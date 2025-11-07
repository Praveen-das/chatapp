import { Socket } from "socket.io";

interface ISocket extends Socket {
  user?: {
    id: string;
    username: string;
  };
  sessionId?: string;
  userId?: string;
  username?: string;
}

export default async function mainAuthMiddleware(socket: ISocket, next: any) {
  const auth = socket.handshake.auth;
  const userId = auth.userId;
  const channels: string[] = auth.channels || [];

  if (userId) {
    socket.userId = userId;
    socket.join(userId);

    if (!!channels.length) {
      console.log("active channels---->", channels.length);
      channels.forEach((channel) => socket.join(channel));
    }

    return next();
  }

  return next(new Error("Not authorized"));
}
