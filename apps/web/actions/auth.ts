"use server";

import {
  clearLocalSession,
  deleteSessionFromDb
} from "./session";
import axiosClient from "@lib/axiosClient";
import { IUser } from "@interfaces/userInterface";
import { sign, verifyAccessToken } from "./jwt";
import useAuth from "@hooks/useAuth";

type IUserCreationReq = {
  username: string;
  phoneNumber: string;
  bio?: string;
  profilePicture?: string;
};

export async function createUser(req: IUserCreationReq): Promise<IUser | null> {
  try {
    const res = await axiosClient.post("/db/user", JSON.stringify(req));
    return res.data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function fetchUser(phonenumber: string): Promise<IUser | null> {
  try {
    const token = await sign({ phonenumber });

    const res = await axiosClient.get(`/db/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data;
  } catch (error) {
    console.log("fetchUser-------->");
    return null;
  }
}

export async function signOut() {
  try {
    const sessionId = useAuth.getState().session?.sessionId;
    if(!sessionId) return
    await deleteSessionFromDb(sessionId);
    await clearLocalSession();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

