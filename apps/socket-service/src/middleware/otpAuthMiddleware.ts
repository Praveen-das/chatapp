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

export default async function otpAuthMiddleware(socket: ISocket, next: any) {
  const auth = socket.handshake.auth
  const OTP_REQUEST = auth.OTP_REQUEST

  if(OTP_REQUEST) return next()

  return next(new Error("Not authorized"));
}
