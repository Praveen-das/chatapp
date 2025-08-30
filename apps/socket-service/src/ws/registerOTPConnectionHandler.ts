import { Namespace, Server } from "socket.io";
import handleDisconnection from "./handleDisconnection";
import { ISocket } from "../interfaces/socketInterfaces";
import registerOTPHandler from "./registerOTPHandler";

export async function onOTPConnection(io: Namespace, socket: ISocket) {
    console.log(`Socket ${socket.id} connected connected to ${process.pid} otp handler`);

    registerOTPHandler(io, socket);

    socket.on('disconnect', async (reason) => {
        console.log('user disconnected----------> ' + reason);

        const matchingSockets = await io.in(socket.userId!).fetchSockets();
        const isDisconnected = matchingSockets.length === 0;

        if (isDisconnected) {
            // let lastSeen = Date.now()

            // const body = { id: socket.userId, updates: { status: 'offline', lastSeen } }

            // produceMessage(body, 'UPDATE_USER')
            // socket.broadcast.emit("user disconnected", { userId: socket.userId, lastSeen });
        }
    });
}
