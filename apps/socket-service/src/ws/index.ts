import { Server } from "socket.io";
import Redis from "ioredis";
import authMiddleware from "../middleware/authMiddleware";
import { createAdapter } from "@socket.io/redis-adapter";
import { IHttpServer, ISocketService } from "../interfaces/socketInterfaces";

import { onConnection } from "./registerConnectionHandler";

class SocketService implements ISocketService {
  io;
  server;

  constructor(server: IHttpServer) {
    console.log("Socket Service runnning...");
    this.server = server;
    this.io = new Server(this.server);
  }

  initAdapter(client: Redis) {
    const pub = client;
    const sub = client.duplicate();

    pub.on("error", (err) => {
      console.log("Redis pubClient Error", err);
      // pub.disconnect()
      console.log("Client disconnected");
    });

    sub.on("error", (err) => {
      console.log("Redis subClient Error", err);
      // sub.disconnect()
      console.log("Client disconnected");
    });

    const adapter = createAdapter(pub, sub);
    this.io.adapter(adapter);
  }

  initListeners() {
    console.log("Socket Listener initailized...");
    this.io.use(authMiddleware);
    this.io.on("connection", (socket) => onConnection(this.io, socket));
  }
}

export default SocketService;
