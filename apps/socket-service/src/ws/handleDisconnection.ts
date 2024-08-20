import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import produceMessage from "../kafka/kafka";

export default function handleDisconnection(io: Server, socket: ISocket) {
    socket.on('disconnect', async (reason) => {
        console.log('user disconnected----------> ' + reason);

        const matchingSockets = await io.in(socket.userId!).fetchSockets();
        const isDisconnected = matchingSockets.length === 0;

        if (isDisconnected) {
            
            const body = { id: socket.userId, updates: { status: 'offline', lastSeen: Date.now() } }
            
            produceMessage(body, 'UPDATE_USER')
            socket.broadcast.emit("user disconnected", { userId: socket.userId });
        }
    });
}
