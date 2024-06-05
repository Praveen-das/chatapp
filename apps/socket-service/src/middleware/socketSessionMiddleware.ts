import { Socket } from "socket.io"
import sessionStore from "../session"
import {Schema} from 'mongoose'

interface ISocket extends Socket {
    user?: {
        id: string
        username: string
    }
    sessionId?: string
    userId?: string
    username?: string
}

export default async function socketSessionMiddleware(socket: ISocket, next: any) {
    const sessionId = socket.handshake.auth.sessionId || socket.sessionId;

    if (sessionId) {
        const session = await sessionStore.findSession(sessionId)

        try {
            if (session) {
                socket.sessionId = sessionId;
                socket.userId = session.userId;
                socket.username = session.username;

                sessionStore.saveSession({ ...session, socketId: socket.id, connected: true })
            } else throw new Error('session is not valid')

        } catch (error) {
            console.log('error------------>', error);
        }
    } else {
        const user = socket.handshake.auth.user;
        const recovered_session = await sessionStore.findSessionByUserId(user.id)
        let sessionId = ''

        if (!user) return next(new Error("invalid username"));

        if (recovered_session) sessionId = recovered_session.id!
        else sessionId = crypto.randomUUID()

        const session: ISession = {
            id: sessionId,
            userId: user.id,
            socketId: socket.id,
            username: user.username,
            connected: true
        }

        socket.sessionId = session.id
        socket.userId = session.userId
        socket.username = session.username

        sessionStore.saveSession(session)
    }

    socket.emit("session", { sessionId: socket.sessionId, userId: socket.userId });
    next();
}