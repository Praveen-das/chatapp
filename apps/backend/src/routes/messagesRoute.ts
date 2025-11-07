import { Router } from "express";
import messageController from "../controller/messageController";

const router = Router();

router.post("/generate", messageController._generateMockMessages);

router.post("/save", messageController._saveMessages);

router.get("/fetch", messageController._getUserMessages);

router.get("/attachments");

export default router;
