import { io, Socket } from "socket.io-client";

interface ISocket extends Socket {
    selectedConversation?: IIConversation | null
}

const socket: ISocket = io('http://localhost:3002', { autoConnect: false });

export default socket;