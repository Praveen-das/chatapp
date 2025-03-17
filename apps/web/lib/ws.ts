import { io, Socket } from "socket.io-client";
import { IConversation } from "../interfaces/conversationInterface";

interface ISocket extends Socket {
  selectedConversation?: IConversation | null;
}

const socket: ISocket = io("http://localhost:3001", {
  transports: ["websocket"],
  autoConnect: false,
});

export default socket;
