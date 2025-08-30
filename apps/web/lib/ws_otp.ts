import { io, Socket } from "socket.io-client";
import { IConversation } from "@repo/interfaces/conversationInterface";

interface ISocket extends Socket {
  selectedConversation?: IConversation | null;
}

const otp_socket: ISocket = io("http://localhost:3001/otp", {
  transports: ["websocket"],
  autoConnect: false,
});

export default otp_socket;