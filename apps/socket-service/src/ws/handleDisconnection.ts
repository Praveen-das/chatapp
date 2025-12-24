import { Namespace, Server } from "socket.io";
import produceMessage from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import client from "../redis/client";

export default function handleDisconnection(io: Server, socket: ISocket) {
  socket.on("disconnect", async (reason) => {
    console.log("user disconnected----------> " + reason);

    const matchingSockets = await io.in(socket.userId!).fetchSockets();
    const isDisconnected = matchingSockets.length === 0;

    if (isDisconnected) {
      let lastSeen = Date.now();

      await client.hset(`user:${socket.userId}`, "status", "offline", "lastSeen", lastSeen.toString());
      await client.sadd("dirty_users", socket.userId!);

      socket.broadcast.emit("user disconnected", { userId: socket.userId, lastSeen });
    }
  });
}
