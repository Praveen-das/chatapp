import { io, Socket } from "socket.io-client";
import { IConversation } from "@repo/interfaces/conversationInterface";

export interface ISocket extends Socket {
  selectedConversation?: IConversation | null;
}

const socket: ISocket = io("http://localhost:3001/", {
  transports: ["websocket"],
  autoConnect: false,
});

export default socket;