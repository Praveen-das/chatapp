import express from "express";
import router from "./routes/index";
import cors from "cors";
import bodyParser from "body-parser";

(async () => {
  const app = express();

  app.use(cors({ origin: ["http://localhost:3001"] }));

  app.use(bodyParser.json());

  app.use(bodyParser.urlencoded({ extended: true }));

  const PORT = process.env.PORT || 5000;

  app.use('/',router); 

  app.use((err:any,req:any,res:any,next:any)=>{
    console.log('ERROR----------------->',err);
  })

  app.listen(PORT, () => {
    console.log(`session-service runnning on port ${PORT}`);
  });
})();
