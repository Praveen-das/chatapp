import { Router } from "express";
import userController from "../controller/userController";

const router = Router();

router
  .get("/", userController._getUser)
  .get("/search", userController._queryUser)
  .get("/all", userController._getAllUsers)
  .get("/key-history/:id", userController._getKeyHistoryByUserId)
  .post("/", userController._createUser)
  .put("/", userController._updateUser)
  .put("/public-key", userController._updatePublicKey)
  .delete("/:id", userController._deleteUser);

export default router;
