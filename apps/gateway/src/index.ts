import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = process.env.PORT || 3001;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
const SESSION_SERVICE_URL = process.env.SESSION_SERVICE_URL || "http://localhost:5000";
const SOCKET_SERVICE_URL = process.env.SOCKET_SERVICE_URL || "http://localhost:3002";

const allowedOrigins = [
  "https://chatapp-web-alpha.vercel.app",
  "http://localhost:3000"
];

// CORS configuration to allow local frontend and production frontend
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  })
);

// Route for backend service (database endpoints)
app.use(
  "/db",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/db": "", // strip /db prefix
    },
  })
);

// Route for session service
app.use(
  "/session",
  createProxyMiddleware({
    target: SESSION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/session": "", // strip /session prefix
    },
  })
);

// Route for socket.io connection / socket-service
app.use(
  "/socket.io",
  createProxyMiddleware({
    target: SOCKET_SERVICE_URL,
    changeOrigin: true,
    ws: true, // enable WebSockets proxying
  })
);

// Health check endpoint
app.get("/health", (_, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.listen(PORT, () => {
  console.log(`[API Gateway] Listening on http://localhost:${PORT}`);
  console.log(`[API Gateway] Proxying /db -> ${BACKEND_URL}`);
  console.log(`[API Gateway] Proxying /session -> ${SESSION_SERVICE_URL}`);
  console.log(`[API Gateway] Proxying /socket.io -> ${SOCKET_SERVICE_URL}`);
});
