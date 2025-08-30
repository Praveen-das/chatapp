import { Request, Response } from "express";
import userServices from "../services/userServices";
import { Types } from "mongoose";
import { IUser } from "../interfaces/userInterface";
import { verifyUserToken } from "@repo/utils";
import { updateUserSchema, userSchema } from "../schemas/userSchema";
import { ZodError } from "zod";

type IUserCreationReq = {
  username: string;
  phoneNumber: string;
  bio?: string;
  profilePicture?: string;
};

const _createUser = async (req: Request<any, any, IUserCreationReq>, res: Response) => {
  try {
    const data = userSchema.parse(req);

    let body: IUser = {
      ...data,
      id: new Types.ObjectId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const user = await userServices.createUser(body);

    res.json(user);
  } catch (error) {
    console.log("error _createUser----->", error);
  }
};

const _getAllUsers = async (req: Request, res: Response) => {
  const users = await userServices.getAllUsers();
  return res.json(users);
};

const _queryUser = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const users = await userServices.queryUser(query);
    res.json(users);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

const _getUser = async (req: Request, res: Response) => {
  try {
    const header = req.headers.authorization;
    const token = header?.split(" ")[1];

    const payload = await verifyUserToken(token);

    if (!payload) return res.sendStatus(401);

    let user = null;
    const phoneNumber = payload.phonenumber as string;
    const userId = new Types.ObjectId(payload.userId as string);

    if (userId) user = await userServices.getUserById(userId);
    if (phoneNumber) user = await userServices.getUserByPhoneNumber(phoneNumber);

    res.json(user);
  } catch (error) {
    res.json(error);
    console.log("_getUser error--->", error);
  }
};

const _getUserById = async (req: Request, res: Response) => {
  let userId = new Types.ObjectId(req.params.id);
  console.log({ userId });
  const user = await userServices.getUserById(userId);

  res.json(user);
};

const _updateUser = async (req: Request, res: Response) => {
  try {
    let updates = updateUserSchema.parse(req.body);
    
    const user = await userServices.updateUser(updates);
    res.json(user);
  } catch (error) {
    if (error instanceof ZodError) {
      console.log("ZodError error _updateUser", error);
      res.json({ errors: error.errors });
    } else {
      console.log("error _updateUser", error);
      res.json({ error: error });
    }
  }
};

const _updateUserFromKafka = async (req: string, reset: () => void) => {
  try {
    let body = JSON.parse(req);
    let updates = updateUserSchema.parse(body);

    userServices.updateUser(updates);
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

export default {
  _createUser,
  _getUser,
  _queryUser,
  _getAllUsers,
  _getUserById,
  _updateUser,
  _deleteUser,
  _updateUserFromKafka,
};
