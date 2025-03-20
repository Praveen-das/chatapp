import connect from "connect";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = connect();

app.use(cors({ origin: "*" }));

const PORT = process.env.PORT || 3001;

const socketService = createProxyMiddleware({
  target: `http://${process.env.SOCKET_SERVICE_HOST || "localhost"}:3002/socket.io`,
  changeOrigin: true,
  ws: true,
  logger: console,
});

const db = createProxyMiddleware({
  target: `http://${process.env.BACKEND_HOST || "localhost"}:4000`,
  changeOrigin: true,
  logger: console,
});

const sessionService = createProxyMiddleware({
  target: `http://${process.env.SESSION_SERVICE_HOST || "localhost"}:5000`,
  changeOrigin: true,
  logger: console,
});

app.use("/socket.io", socketService);
app.use("/db", db);
app.use("/session", sessionService);

app.use((err: any, req: any, res: any, next: any) => {
  console.log("session service error----------->", err);
});

app.listen(3001, () => {
  console.log(`server running on port ${PORT}`);
});
