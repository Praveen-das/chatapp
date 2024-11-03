import connect from "connect";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = connect();

app.use(cors({ origin: 
  // "http://localhost:3000"
  '*'
}));

const PORT = process.env.PORT || 3001;

const socketService = createProxyMiddleware({
  target: "http://192.168.1.7:3002/socket.io",
  changeOrigin: true,
  ws: true,
  logger: console,
});

const messageService = createProxyMiddleware({
  target: "http://192.168.1.7:4000",
  changeOrigin: true,
  logger: console,
});

app.use("/message", messageService);
app.use("/socket.io", socketService);

app.listen(3001, () => {
  console.log(`server running on port ${PORT}`);
});
