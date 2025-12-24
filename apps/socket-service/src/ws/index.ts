import { Server } from "socket.io";
import Redis from "ioredis";
import mainAuthMiddleware from "../middleware/mainAuthMiddleware";
import { createAdapter } from "@socket.io/redis-adapter";

import { onConnection } from "./registerConnectionHandler";
import { IHttpServer, ISocketService } from "../interfaces/socketInterfaces";
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
    console.log("Socket Listener initailized...");
    // const main = this.io.of("/main");
    // const otp = this.io.of("/otp");

    // otp.use(otpAuthMiddleware);

    this.io.use((socket, next) => mainAuthMiddleware(socket, this.io, next));
    this.io.on("connection", (socket) => onConnection(this.io, socket));
    // otp.on("connection", (socket) => onOTPConnection(main, socket));
  }
}

export default SocketService;
