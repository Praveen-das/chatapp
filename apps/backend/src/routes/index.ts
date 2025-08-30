import { Router } from "express";
import conversationsRoute from "./conversationsRoute";
import messagesRouter from "./messagesRoute";
import userRoute from "./userRoute";
import groupRoute from "./groupRoute";
import imageKitRouter from "./imageKitRouter";

const router = Router();

router.get("/", (_, res) => res.json("chat app server"));

router.use("/conversation", conversationsRoute);

router.use("/group", groupRoute);

router.use("/messages", messagesRouter);

router.use("/user", userRoute);

router.use("/imagekit", imageKitRouter);

export default router;
