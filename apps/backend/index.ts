import express from "express";
import router from "./src/routes";
import initDatabase from "./src/db/mongoose";
import { initKafkaConsumer } from "./src/kafka/kafka";
import cors from "cors";
import bodyParser from "body-parser";
import { verifyAuth } from "./src/middlewares/auth";
import otpRoute from "./src/routes/otpRoute";

(async () => {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5000"],
    })
  );

  app.use(bodyParser.json());

  app.use(bodyParser.urlencoded({ extended: true }));

  const PORT = process.env.PORT || 4000;

  try {
    initKafkaConsumer();
    await initDatabase();
  } catch (error) {
    console.log("error line 20 ----->", error);
  }

  app.get("/health", (_, res) => res.json({ status: "okay" }));
  app.use('/otp', otpRoute);
  app.use(verifyAuth);
  app.use(router);

  app.use((err: any, req: any, res: any, next: any) => {
    console.log("ERROR----------------->", err);
  });

  app.listen(PORT, () => {
    console.log(`Backend runnning on port ${PORT}`);
  });
})();
