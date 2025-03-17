import { Request, Response } from "express";
import userServices from "../services/userServices";
import mongoose, { Types } from "mongoose";
import { IUser } from "../interfaces/userInterface";
import { serialize } from "cookie";
import { jwtVerify } from "jose";
import { verify } from "../lib/jwt";

type IUserCreationReq = {
  username: string;
  phoneNumber: string;
  bio?: string;
  profilePicture?: string;
};

const _createUser = async (
  req: Request<any, any, IUserCreationReq>,
  res: Response
) => {
  let body: IUser = {
    id: new Types.ObjectId(),
    username: req.body.username,
    phoneNumber: req.body.phoneNumber,
    bio: "",
    profilePicture: req.body.profilePicture,
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

const _queryUser = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string
    const users = await userServices.queryUser(query);
    res.json(users);
  } catch (error) {
    console.log(error)
    res.send(error)
  }
};

const _getUser = async (req: Request, res: Response) => {
try {
    const header = req.headers.authorization
    const token = header?.split(' ')[1]
    
    const payload = await verify(token)
  
    if(!payload) return res.sendStatus(401)
    
    let user = null;
    const phoneNumber = payload.phonenumber as string
    const userId = new Types.ObjectId(payload.userId as string);
    
    if (userId) user = await userServices.getUserById(userId);
    if (phoneNumber) user = await userServices.getUserByPhoneNumber(phoneNumber);
    res.json(user);
} catch (error) {
  res.json(error)
  console.log('_getUser error--->',error)
}
};

const _getUserById = async (req: Request, res: Response) => {
  let userId = new Types.ObjectId(req.params.id);
  console.log({ userId });
  const user = await userServices.getUserById(userId);

  res.json(user);
};

const _updateUser = async (req: Request, res: Response) => {
  let id = req.params.id;

  let updates = req.body;
  
  const user = await userServices.updateUser(id, updates);
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

    const response = await userServices.blockUser({ userId, blockedId, id });
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
  _getUser,
  _queryUser,
  _getAllUsers,
  _getUserById,
  _updateUser,
  _deleteUser,
  _updateUserFromKafka,
  _blockUser,
  _unblockUser,
  _getBlockedListByUserId,
};
