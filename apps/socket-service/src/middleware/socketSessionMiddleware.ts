import { Socket } from "socket.io";
import sessionStore from "../session";
import { Schema } from "mongoose";

interface ISocket extends Socket {
  user?: {
    id: string;
    username: string;
  };
  sessionId?: string;
  userId?: string;
  username?: string;
}

export default async function socketSessionMiddleware(
  socket: ISocket,
  next: any
) {
  const sessionId = socket.handshake.auth.sessionId || socket.sessionId;
  const user: IUser = socket.handshake.auth.user;

  let session = await sessionStore.findSession(sessionId);
  
  // if (!Object.values(session).length)
  //   session = (await sessionStore.findSessionByUserId(user.id))!;
  
  if (session && !!Object.values(session).length) {
    try {
      socket.sessionId = session.sessionId;
      socket.userId = session.userId;
      socket.username = session.username;
    } catch (error) {
      console.log("error------------->", error);
    }
  } else {
    if (!user) return next(new Error("invalid username"));

    let sessionId = crypto.randomUUID();

    socket.sessionId = sessionId;
    socket.userId = user.id;
    socket.username = user.username;

    sessionStore.saveSession({
      sessionId,
      userId: socket.userId,
      username: socket.username,
    });

    socket.broadcast.emit("new user created", user);
    socket.emit("sessionId", socket.sessionId);
  }

  next();
}
