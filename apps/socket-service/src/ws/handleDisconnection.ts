import { Namespace, Server } from "socket.io";
import produceMessage from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";

export default function handleDisconnection(io: Server, socket: ISocket) {
    socket.on('disconnect', async (reason) => {
        console.log('user disconnected----------> ' + reason);

        const matchingSockets = await io.in(socket.userId!).fetchSockets();
        const isDisconnected = matchingSockets.length === 0;

        if (isDisconnected) {
            let lastSeen = Date.now()

            const body = { id: socket.userId, updates: { status: 'offline', lastSeen } }

            produceMessage(body, 'UPDATE_USER')
            socket.broadcast.emit("user disconnected", { userId: socket.userId, lastSeen });
        }
    });
}
