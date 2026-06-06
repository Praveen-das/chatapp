import { verifyAccessToken } from "@repo/utils";
import { ISocket } from "../interfaces/socketInterfaces";

/**
 * Pure auth gate — verifies the access token and attaches userId to socket.
 * No side effects (no joins, no emits). Those belong in the connection handler.
 */
export default async function mainAuthMiddleware(socket: ISocket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: no token provided"));
  }

  const payload = await verifyAccessToken(token);

  if (!payload) {
    return next(new Error("Authentication error: invalid token"));
  }

  if (payload.expired) {
    return next(new Error("Authentication error: token expired"));
  }

  socket.userId = payload.userId;
  socket.sessionId = payload.sessionId;

  return next();
}
