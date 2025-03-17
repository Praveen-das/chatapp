"use server";

import { fetchUser } from "./auth";
import { saveSession } from "./session";

export async function verifyOtpAndGetUser(phonenumber: string, otp?: number) {
  //if otp verified successfully
  const user = await fetchUser(phonenumber);
  
  if (user) {
    await saveSession(user)
    return true;
  }

  return false;
}
