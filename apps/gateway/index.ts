import connect from "connect";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = connect();

app.use(cors({ origin: "*" }));

const PORT = process.env.PORT || 3001;
const LOCALHOST = "http://localhost";

const socketService = createProxyMiddleware({
  target: `${process.env.SOCKET_SERVICE_URL || LOCALHOST+':3002'}/socket.io`,
  changeOrigin: true,
  ws: true,
  logger: console,
});

const db = createProxyMiddleware({
  target: `${process.env.BACKEND_URL || LOCALHOST+':4000'}`,
  changeOrigin: true,
  logger: console,
});

const sessionService = createProxyMiddleware({
  target: `${process.env.SESSION_SERVICE_URL || LOCALHOST + ":5000"}`,
  changeOrigin: true,
  logger: console,
});

const health = createProxyMiddleware({
  target: `${process.env.HEALTH_SERVICE_URL}|| LOCALHOST + ":3003"`,
  changeOrigin: true,
  logger: console,
});

app.use("/socket.io", socketService);
app.use("/db", db);
app.use("/session", sessionService);
app.use("/health", health);

app.use((err: any, req: any, res: any, next: any) => {
  console.log("session service error----------->", err);
});

app.listen(3001, () => {
  console.log(`server running on port ${PORT}`);
});
