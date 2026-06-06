import express from "express";
import router from "./src/routes";
import initDatabase from "./src/db/mongoose";
import { initKafkaConsumer } from "./src/kafka/kafka";
import bodyParser from "body-parser";
import { verifyAuth } from "./src/middlewares/auth";
import otpRoute from "./src/routes/otpRoute";
import { otpRateLimiter } from "./src/rateLimit/otp";

(async () => {
  const app = express();
  app.set("trust proxy", 1);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  const PORT = process.env.PORT || 4000;

  // Tracks infra readiness — health check responds 200 immediately
  // but reports actual status so ALB/target groups can gate traffic
  let isReady = false;
  let startupError: string | null = null;

  app.get("/health", (_, res) => {
    if (startupError) {
      return res.status(503).json({ status: "error", error: startupError });
    }
    return res.status(200).json({
      status: isReady ? "ready" : "starting",
    });
  });

  app.use("/otp", otpRateLimiter, otpRoute);

  app.use(verifyAuth);
  app.use(router);

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  // Start listening FIRST so ECS health checks don't timeout
  app.listen(PORT as any, "0.0.0.0", async () => {
    console.log(`Backend listening on port ${PORT}`);

    try {
      await initDatabase();
      await initKafkaConsumer();
      isReady = true;
      console.log("All services initialized — server is ready");
    } catch (error) {
      console.error("Fatal startup error:", error);
      startupError = error instanceof Error ? error.message : String(error);
      // Give ECS time to see the 503 before exiting
      setTimeout(() => process.exit(1), 5000);
    }
  });
})();
