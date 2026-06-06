import SocketService from "./ws";
import http from "http";
import { setupWorker } from "@socket.io/sticky";
import { initUserPersistenceCron } from "./ws/cron/userPersistence";

const PORT = process.env.PORT || 3002;
const HEALTH_PORT = process.env.HEALTH_PORT || 3003;

(async () => {
  const httpServer = http.createServer();

  const socket = new SocketService(httpServer);

  socket.initAdapter();

  socket.initListeners();

  initUserPersistenceCron();

  httpServer.listen(Number(PORT), () => {
    console.log(`socket-service listening on :${PORT}`);
  });

  // Separate health check server for ALB/ECS probes
  http
    .createServer((req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");
        return;
      }
      res.writeHead(404);
      res.end();
    })
    .listen(Number(HEALTH_PORT), () => {
      console.log(`health check listening on :${HEALTH_PORT}`);
    });

  // setupWorker(socket.io);
})();
