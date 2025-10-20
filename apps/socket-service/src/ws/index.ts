import { Server } from "socket.io";
import Redis from "ioredis";
import mainAuthMiddleware from "../middleware/mainAuthMiddleware";
import { createAdapter } from "@socket.io/redis-adapter";

import { onConnection } from "./registerConnectionHandler";
import { IHttpServer, ISocketService } from "../interfaces/socketInterfaces";

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
      pub.disconnect()
      console.log("Client disconnected");
    });

    sub.on("error", (err) => {
      console.log("Redis subClient Error", err);
      sub.disconnect()
      console.log("Client disconnected");
    });

    const adapter = createAdapter(pub, sub);
    this.io.adapter(adapter);
  }

  initListeners() {
    console.log("Socket Listener initailized...");
    // const main = this.io.of("/main");
    // const otp = this.io.of("/otp");
    
    // otp.use(otpAuthMiddleware);
    
    this.io.use(mainAuthMiddleware);
    this.io.on("connection", (socket) => onConnection(this.io, socket));
    // otp.on("connection", (socket) => onOTPConnection(main, socket));
  }
}

export default SocketService;
