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

export async function createUser(input: IUserCreationReq, otpToken: string) {
  const data = await axiosClient
    .post<IUser>("/db/user", input, {
      headers: { "x-otp-token": otpToken },
    })
    .then((res) => res.data);

  return data;
}

export async function fetchUser(phonenumber: string): Promise<IUser | null> {
  try {
    const token = await createUserToken({ phonenumber });
    const res = await axiosClient.get(`/db/user`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data?.error) throw res.data.error;
    return res.data;
  } catch (error: any) {
    throw error.message;
  }
}
