"use server";

import axiosClient from "@lib/axiosClient";
import { IUser } from "@repo/interfaces/userInterface";
import { createUserToken } from "@repo/utils";

type IUserCreationReq = {
  username: string;
  phoneNumber: string;
  bio?: string;
  profilePicture?: string;
};

export async function createUser(input: IUserCreationReq): Promise<IUser | null> {
  try {
    const data = await axiosClient.post("/db/user", JSON.stringify(input)).then((res) => res.data);
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function fetchUser(phonenumber: string): Promise<IUser | null> {
  try {
    const token = await createUserToken({ phonenumber });
    const res = await axiosClient.get(`/db/user`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data?.error) throw res.data.error;
    return res.data;
  } catch (error: any) {
    throw error
  }
}
