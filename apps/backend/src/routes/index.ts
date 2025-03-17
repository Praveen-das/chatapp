import { Router } from "express";
import conversationRoute from "./conversationRoute";
import messagesRouter from "./messagesRoute";
import userRoute from "./userRoute";
import groupRoute from "./groupRoute";
import imageKitRouter from "./imageKitRouter";
import archiveRoute from "./archiveRoute";

const router = Router();

router.get("/", (_, res) => res.json("chat app server"));

router.use("/conversation", conversationRoute);

router.use("/group", groupRoute);

router.use("/archive", archiveRoute);

router.use("/messages", messagesRouter);

router.use("/user", userRoute);

router.use("/imagekit", imageKitRouter);

export default router;
