import express from "express";
import { assistWithText } from "../controller/aiController";

const router = express.Router();

import { aiRateLimiter } from "../middleware/rateLimiter";

router.post("/assist", aiRateLimiter, assistWithText);

export default router;
