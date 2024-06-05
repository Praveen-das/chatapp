import { Server } from "socket.io";
import sessionStore from "../session";
import { ISocket } from "../interfaces/socketInterfaces";

export default function handleDisconnection(io: Server, socket: ISocket) {
    socket.on('disconnect', async () => {
        const matchingSockets = await io.in(socket.id).fetchSockets();
        const isDisconnected = matchingSockets.length === 0;

        if (isDisconnected) {
            const session = {
                id: socket.sessionId,
                userId: socket.userId!,
                socketId: socket.id,
                username: socket.username!,
                connected: false,
                lastSeen: Date.now()
            };

            socket.broadcast.emit("user disconnected", session);
            sessionStore.saveSession(session);
        }

    });
}
