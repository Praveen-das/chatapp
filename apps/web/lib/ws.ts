import { io, Socket } from "socket.io-client";
import { IConversation } from "@repo/interfaces/conversationInterface";

export interface ISocket extends Socket {
  selectedConversation?: IConversation | null;
}

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

const socket: ISocket = io(`${baseURL}/`, {
  transports: ["websocket"],
  autoConnect: false,
});

export default socket;
