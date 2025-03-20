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

export default async function authMiddleware(socket: ISocket, next: any) {
  const userId = socket.handshake.auth.userId;
  const channelIds = socket.handshake.auth.channelIds;
  
  if (userId) {
    socket.userId = userId;

    [userId, ...channelIds].forEach((id) => {
      socket.join(id);
    });

    return next();
  }

  return next(new Error("Not authorized"));
}
