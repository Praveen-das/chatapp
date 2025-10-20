import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import axiosSessionClient from "../lib/axiosSessionClient";

export default function registerSessionHandler(io: Server, socket: ISocket) {
  socket.on("END_SESSION", async (sessionIds: string[]) => {
    io.to(socket.userId!).emit("END_SESSION", sessionIds);
    await axiosSessionClient.post(`/clear`, { userId: socket.userId, sessionIds });
  });
}
