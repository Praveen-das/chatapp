"use server";

import { ISession } from "@interfaces/sessionInterface";
import axiosClient from "@lib/axiosClient";
import { getDeviceDetails, getGeoLocationDetails } from "@lib/device";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "./jwt";
import { IUser } from "@interfaces/userInterface";
import useAuth from "@hooks/useAuth";

const cookie: any = {
  name: "token",
  options: {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 31536000,
  },
};

export async function saveSession(user: IUser) {
  try {
    const { os, browser, device } = getDeviceDetails();
    const { city } = await getGeoLocationDetails();
    const sessionId = crypto.randomUUID();

    const sessionData: ISession = {
      userId: user.id,
      sessionId,
      data:{
        userData: user,
        deviceData: {
          browser,
          os,
          device,
          city,
          timestamp: Date.now(),
        },
      }
    };

    const token = await createAccessToken({userId:sessionData?.userId});
    const refresh_token = await createRefreshToken(sessionData);

    await axiosClient.post("/session", JSON.stringify(sessionData));

    cookies().set(cookie.name, refresh_token, cookie.options);
    return token;
  } catch (error) {
    console.log(error);
  }
}

export async function updateSession(user: IUser) {
  try {
    const { os, browser, device } = getDeviceDetails();
    const { city } = await getGeoLocationDetails();
    const token = await getRefreshToken()
    const session = await verifyRefreshToken(token!)

    if(!session) return

    const sessionData: ISession = {
      ...session,
      data: {
        userData:user,
        deviceData: {
          browser,
          os,
          device,
          city,
          timestamp: Date.now(),
        },
      }
    };

    const access_token = await createAccessToken({userId:sessionData?.userId});
    const refresh_token = await createRefreshToken(sessionData);

    await axiosClient.post("/session", JSON.stringify(sessionData));

    cookies().set(cookie.name, refresh_token, cookie.options);
    return access_token
  } catch (error) {
    console.log(error);
  }
}

export async function withSession<T>(f: () => Promise<T>): Promise<T> {
  // const accessToken = useAuth.getState().accessToken;
  // const setAccessToken = useAuth.getState().setAccessToken!;

  // const session = await verifyAccessToken(accessToken!);

  // if (session?.expired) {
  //   const { access_token } = (await refreshToken())!;
  //   if (!access_token) return redirect("/register");
  //   setAccessToken(access_token);
  // }

  return f();
}

export async function getRefreshToken() {
  const cookieStore = cookies();
  const token = cookieStore.get(cookie.name)?.value;
  return token;
}

export async function refreshToken(): Promise<{ access_token: string } | null> {
  try {
    const token = await getRefreshToken();
    
    if (!token) return null;
    
    const session = await verifyRefreshToken(token);
    
    if (!session || session.expired) {
      await clearLocalSession()
      return null
    };
    
    const res = await axiosClient.get(
      `/session/fetch?sessionId=${session.sessionId}`
    );
    
    if (!res.data) {
      await clearLocalSession()
      return null;
    }

    // const sessionData = await verifyRefreshToken(token);
    const access_token = await createAccessToken({userId:res.data.userId});
    const refresh_token = await createRefreshToken(res.data);

    return { access_token };
    
  } catch (error) {
    console.log('Error refreshToken---->',error)
    return null;
  }
}

export async function clearLocalSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookie.name);
}

export async function deleteSessionFromDb(sessionId: string) {
  try {
    const sessions = (await axiosClient.delete(`/session/delete/${sessionId}`))
      .data;
    return true;
  } catch (error) {
    return false;
  }
}
