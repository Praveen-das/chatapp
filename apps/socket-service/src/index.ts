import SocketService from "./ws";
import http from "http";
import { setupWorker } from "@socket.io/sticky";
import { initUserPersistenceCron } from "./ws/cron/userPersistence";

const PORT = process.env.PORT || 3002;

(async () => {
  const httpServer = http.createServer();

  const socket = new SocketService(httpServer);

  socket.initAdapter();

  socket.initListeners();

  initUserPersistenceCron();

  socket.io.listen(Number(PORT));

  // setupWorker(socket.io);
})();
