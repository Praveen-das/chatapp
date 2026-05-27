import { Request, Response } from "express";
import userServices from "../services/userServices";
import { MongooseError, Types } from "mongoose";
import { IUser } from "../interfaces/userInterface";
import { verifyUserToken } from "@repo/utils";
import { bulkUpdateUsersSchema, updateUserSchema, userSchema } from "../schemas/userSchema";
import { ZodError } from "zod";
import { verifyOtpToken } from "../lib/otpToken";

type IUserCreationReq = {
  username: string;
  phoneNumber: string;
  bio?: string;
  profilePicture?: string;
};

const _createUser = async (req: Request<any, any, IUserCreationReq>, res: Response) => {
  try {
    // Verify OTP token from header — proves the phone number was verified
    const otpToken = req.headers["x-otp-token"] as string | undefined;

    if (!otpToken) {
      return res.status(401).json({ error: { message: "OTP verification required" } });
    }

    const verifiedPhone = await verifyOtpToken(otpToken);
    if (!verifiedPhone) {
      return res.status(401).json({ error: { message: "OTP token invalid or expired" } });
    }

    const data = userSchema.parse(req.body);

    // Ensure the phone number matches the OTP-verified one
    if ("+" + data.phoneNumber !== verifiedPhone && data.phoneNumber !== verifiedPhone) {
      return res.status(403).json({ error: { message: "Phone number mismatch" } });
    }

    let body: IUser = {
      ...data,
      id: new Types.ObjectId(data.id),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const user = await userServices.createUser(body);

    res.json(user);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: { message: error.errors[0]?.message } });
    }
    if (error instanceof MongooseError) {
      return res.status(500).json({ error: { message: error.message } });
    }
    if (error instanceof Error && (error as any).code === 11000) {
      return res.status(409).json({ error: { message: "Username already exists", code: 11000 } });
    }
    return res.status(500).json({ error: { message: "Failed to create user" } });
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
    console.log("_getUser error--->", error);
    if (error instanceof MongooseError) return res.json({ error: error.message, status: 500 });
    if (error instanceof Error) return res.json({ error: error.message });
    res.json({ error });
  }
};

const _getUserById = async (req: Request, res: Response) => {
  if (!req.params.id) return res.json({ error: "User ID is required" });

  let userId = new Types.ObjectId(req.params.id);
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

const _bulkUpdateUsers = async (req: string, reset: () => void) => {
  try {
    let body = JSON.parse(req);
    let updates = bulkUpdateUsersSchema.parse(body);

    userServices.bulkUpdateUsers(updates);
  } catch (error) {
    console.log("UPDATE_USER error--->", error);
    reset();
  }
};

const _updateUserRule = async (req: string, reset: () => void) => {
  try {
    let body = JSON.parse(req);
    // let updates = updateUserSchema.parse(body);
    userServices.updateUserRule(body);
  } catch (error) {
    console.log("_updateUserRule error--->", error);
    reset();
  }
};

const _deleteUser = async (req: Request, res: Response) => {
  const authUserId = (req as any).authUserId;
  if (!authUserId || authUserId !== req.params.id) {
    return res.status(403).json({ error: "Forbidden: you can only delete your own account" });
  }

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
  _updateUserRule,
  _bulkUpdateUsers,
};
