import { Router } from "express";
import sessionServices from "../services";
import sessionController from "../controller";

const router = Router();

router.get("/health", (_:any, res:any) => res.json("ok"));

router.get("/", sessionServices.getAllSessions);

router.get('/fetch', sessionController._getSession)

router.post("/", sessionServices.saveSession);

router.patch("/", sessionServices.updateSession);

router.delete("/delete/:id", sessionServices.deleteSession);

router.post("/clear", sessionServices.clearUserSessions);

export default router;
