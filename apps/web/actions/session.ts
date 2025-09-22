"use server";

import { ISession } from "@repo/interfaces/sessionInterface";
import { createAccessToken, createRefreshToken } from "@repo/utils";
import axiosClient from "@lib/axiosClient";
import { getDeviceDetails, getGeoLocationDetails } from "@lib/device";
import { cookies, headers } from "next/headers";
import { IUser } from "@repo/interfaces/userInterface";
import { NextRequest } from "next/server";
import { getServerSession as _getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { AxiosError } from "axios";

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

export async function createTokens(user: IUser) {
  try {
    const { os, browser, device } = getDeviceDetails();
    const { city } = await getGeoLocationDetails();
    const sessionId = crypto.randomUUID();

    const access_token = await createAccessToken({ userId: user.id, sessionId });
    const refresh_token = await createRefreshToken({ userId: user.id, sessionId });

    const sessionData: ISession = {
      userId: user.id as string,
      sessionId,
      data: {
        browser,
        os,
        device,
        city,
        timestamp: Date.now(),
      },
    };

    !process.env.NEXT_PUBLIC_CLIENT_ONLY && (await axiosClient.post("/session", JSON.stringify(sessionData)));

    return { access_token, refresh_token, sessionId };
  } catch (error) {
    console.log(error);
    throw Error("Token creation failed");
  }
}

export async function refreshToken() {
  try {
    const res = await validateRefreshToken();

    if (!res) {
      console.log("Invalid session");
      return null;
    }

    const access_token = await createAccessToken({ userId: res.userId });
    return access_token;
  } catch (error) {
    if (error instanceof Error) {
      console.log("instanceof Error refreshToken---->", error);
    }

    if (error instanceof AxiosError) {
      console.log("instanceof AxiosError refreshToken---->", {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
      });
    }

    return null;
  }
}

export async function validateRefreshToken() {
  try {
    const req = new NextRequest(process.env.NEXTAUTH_URL!, { headers: { cookie: headers().get("cookie") || "" } });
    const token = await getToken({ req: req });

    if (!token) throw Error("Token not found login again");

    const res = await axiosClient.get(`/session/token`, {
      headers: {
        Authorization: `Bearer ${token.refresh_token}`,
      },
    });

    return res.data;
  } catch (error: any) {
    console.log("validateRefreshToken error------>", {
      status: error?.response?.status,
      statusText: error?.response?.data,
    });

    return null;
  }
}

export async function clearLocalSession() {
  const cookieStore = await cookies();
  cookieStore.delete("next-auth.session-token");
}

export async function deleteCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("user");
  console.log("deleteCookie");
}

export async function deleteSessionFromDb(sessionId: string) {
  try {
    const sessions = (await axiosClient.delete(`/session/delete/${sessionId}`)).data;
    return true;
  } catch (error) {
    return false;
  }
}
