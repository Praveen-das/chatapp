import { Router } from "express";
import messageController from "../controller/messageController";

const router = Router();

router.get("/fetch", messageController._getMessages);

router.get("/attachments");

export default router;
