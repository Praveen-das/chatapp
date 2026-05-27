import { Namespace, Server } from "socket.io";
import produceMessage from "../kafka/kafka";
import { ISocket } from "../interfaces/socketInterfaces";
import client from "../redis/client";

export default function handleDisconnection(io: Server, socket: ISocket) {
  socket.on("disconnect", async (reason) => {
    console.log("user disconnected----------> " + reason);

    if (socket.userId) {
      try {
        await client.srem(`active_sockets:${socket.userId}`, socket.id);
        const remainingCount = await client.scard(`active_sockets:${socket.userId}`);
        const matchingSockets = await io.in(socket.userId).fetchSockets();

        const isDisconnected = remainingCount === 0 || matchingSockets.length === 0;

        if (isDisconnected) {
          let lastSeen = Date.now();

          await client.hset(`user:${socket.userId}`, "status", "offline", "lastSeen", lastSeen.toString());
          await client.sadd("dirty_users", socket.userId);
          await client.del(`active_sockets:${socket.userId}`);

          socket.broadcast.emit("user disconnected", { userId: socket.userId, lastSeen });
        }
      } catch (e) {
        console.error(`disconnect: Redis unavailable for ${socket.userId}`, e);
        // Fallback: use fetchSockets only to determine if user is truly offline
        const matchingSockets = await io.in(socket.userId).fetchSockets();
        if (matchingSockets.length === 0) {
          socket.broadcast.emit("user disconnected", { userId: socket.userId, lastSeen: Date.now() });
        }
      }
    }
  });
}
