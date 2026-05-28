import { Router } from "express";
import conversationController from "../controller/conversationController";

const router = Router();

router.post("/:userId", conversationController._syncConversations);

export default router;
