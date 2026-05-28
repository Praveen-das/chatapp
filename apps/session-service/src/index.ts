import express from "express";
import router from "./routes/index";
import bodyParser from "body-parser";
import { errorHandler } from "./middleware/errorHandler";

(async () => {
  const app = express();

  app.use(bodyParser.json());

  app.use(bodyParser.urlencoded({ extended: true }));

  const PORT = process.env.PORT || 5000;

  app.use("/", router);

  //@ts-ignore
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`session-service runnning on port ${PORT}`);
  });
})();
