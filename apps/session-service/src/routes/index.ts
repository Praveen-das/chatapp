import { Router } from "express";
import sessionController from "../controller";
import { validate } from "../middleware/validation.middleware";
import {
  saveSessionSchema,
  updateSessionSchema,
  deleteSessionSchema,
  clearSessionsSchema,
  getSessionSchema,
  refreshTokenSchema,
} from "../schemas/session.schema";

const router = Router();

router.get("/health", (_, res: any) => res.json({ status: "ok" }));

router.get("/fetch", validate(getSessionSchema), sessionController.getSession);

router.get("/token", validate(refreshTokenSchema), sessionController.refreshToken);

router.post("/", validate(saveSessionSchema), sessionController.saveSession);

router.patch("/", validate(updateSessionSchema), sessionController.updateSession);

router.delete("/delete/:id", validate(deleteSessionSchema), sessionController.deleteSession);

router.post("/clear", validate(clearSessionsSchema), sessionController.clearUserSessions);

export default router;
