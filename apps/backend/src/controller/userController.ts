import { Request, Response } from "express";
import userServices from "../services/userServices";
import mongoose, { Types } from "mongoose";
import { IUser } from "../interfaces/userInterface";

const _createUser = async (req: Request, res: Response) => {
  let id = new Types.ObjectId();

  let body: IUser = {
    id,
    username: "user_" + id.toString().slice(0, 10),
    bio: "",
    profilePicture: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const user = await userServices.createUser(body);

  res.json(user);
};

const _getAllUsers = async (req: Request, res: Response) => {
  const users = await userServices.getAllUsers();
  res.json(users);
};

const _getUserById = async (req: Request, res: Response) => {
  let userId = new Types.ObjectId(req.params.id);
  const user = await userServices.getUserById(userId);
  res.json(user);
};

const _updateUser = async (req: Request, res: Response) => {
  let userId = req.params.id;

  let updates = req.body;

  const user = await userServices.updateUser(userId, updates);
  res.json(user);
};

const _updateUserFromKafka = async (req: string, reset: () => void) => {
  try {
    let { id, updates } = JSON.parse(req);

    userServices.updateUser(id, updates);
  } catch (error) {
    console.log("UPDATE_USER error--->", error);
    reset();
  }
};

const _deleteUser = async (req: Request, res: Response) => {
  let userId = new Types.ObjectId(req.params.id);

  const user = await userServices.deleteUser(userId);
  res.json(user);
};

const _blockUser = async (req: Request, res: Response) => {
  try {
    let body = req.body;

    let userId = new Types.ObjectId(body.userId);
    let blockedId = new Types.ObjectId(body.blockedId);
    let id = new Types.ObjectId(body.id);

    const response = await userServices.blockUser({ userId, blockedId,id });
    res.json(response);
  } catch (error) {
    console.log("UPDATE_USER error--->", error);
    // reset()
  }
};

const _unblockUser = async (req: Request, res: Response) => {
  try {
    let id__ = req.params.id;
    let id = new Types.ObjectId(id__);

    const response = await userServices.unblockUser(id);
    res.json(response);
  } catch (error) {
    console.log("UPDATE_USER error--->", error);
    // reset()
  }
};

const _getBlockedListByUserId = async (req: Request, res: Response) => {
  try {
    let id = req.params.id;
    let userId = new Types.ObjectId(id);

    const blockedList = await userServices.getBlockedListByUserId(userId);
    res.json(blockedList);
  } catch (error) {
    console.log("UPDATE_USER error--->", error);
    // reset()
  }
};

export default {
  _createUser,
  _getAllUsers,
  _getUserById,
  _updateUser,
  _deleteUser,
  _updateUserFromKafka,
  _blockUser,
  _unblockUser,
  _getBlockedListByUserId,
};
