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
  const auth = socket.handshake.auth
  const userId = auth.userId;
  const channelIds = auth.channelIds;
  
  if (userId) {
    socket.userId = userId;

    [userId, ...channelIds].forEach((id) => {
      socket.join(id);
    });

    return next();
  }

  return next(new Error("Not authorized"));
}
