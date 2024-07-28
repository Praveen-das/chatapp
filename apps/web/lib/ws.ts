import { io, Socket } from "socket.io-client";

interface ISocket extends Socket {
    selectedConversation?: IConversation | null
}

const socket: ISocket = io('http://localhost:3002', { autoConnect: false });

export default socket;