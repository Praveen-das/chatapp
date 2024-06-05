import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import handleDisconnection from "./handleDisconnection";
import registerGroupHandlers from "./registerGroupHandlers";
import registerMessageHandlers from "./registerMessageHandlers";
import registerUserHandlers from "./registerUserHandlers";

export async function onConnection(io: Server, socket: ISocket) {
    console.log(`Socket ${socket.id} connected connected to ${process.pid}`);

    registerUserHandlers(io, socket);

    registerMessageHandlers(io, socket);

    registerGroupHandlers(io, socket);

    handleDisconnection(io, socket);
}
