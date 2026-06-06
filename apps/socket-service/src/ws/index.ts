import { Server } from "socket.io";
import mainAuthMiddleware from "../middleware/mainAuthMiddleware";
import { createAdapter } from "@socket.io/redis-adapter";

import { onConnection } from "./registerConnectionHandler";
import { IHttpServer, ISocket, ISocketService } from "../interfaces/socketInterfaces";
import { pub, sub } from "../pubsub";
import saveMessageRequestListener from "../redis/listeners/saveMessage";
import client from "../redis/client";

class SocketService implements ISocketService {
  io;
  server;

  constructor(server: IHttpServer) {
    console.log("Socket Service runnning...");
    this.server = server;
    this.io = new Server(this.server);
  }

  initAdapter() {
    const adapter = createAdapter(pub, sub);
    this.io.adapter(adapter);
  }

  async initRedisListeners() {
    const subscriber = client.duplicate();

    await Promise.all([saveMessageRequestListener(subscriber)]);
  }

  initListeners() {
    this.io.use((socket, next) => mainAuthMiddleware(socket as ISocket, next));
    this.io.on("connection", (socket) => onConnection(this.io, socket));
  }
}

export default SocketService;
