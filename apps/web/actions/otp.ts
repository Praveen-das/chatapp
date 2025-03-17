"use server";

import { fetchUser } from "./auth";
import { saveSession } from "./session";

export async function verifyOtpAndGetUser(phonenumber: string, otp?: number) {
  //if otp verified successfully
  console.log('phonenumber from srver action', phonenumber)
  const user = await fetchUser(phonenumber);
  console.log({user})
  
  if (user) {
    await saveSession(user)
    return true;
  }

  return false;
}
