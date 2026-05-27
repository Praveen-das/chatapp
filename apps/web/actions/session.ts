"use server";

import { ISession } from "@repo/interfaces/sessionInterface";
import { createAccessToken, createRefreshToken } from "@repo/utils";
import axiosClient from "@lib/axiosClient";
import { getDeviceDetails, getGeoLocationDetails } from "@lib/device";
import { cookies } from "next/headers";
import { IUser } from "@repo/interfaces/userInterface";
import { getServerSession as _getServerSession } from "next-auth";
import { decode } from "next-auth/jwt";
import { AxiosError } from "axios";
import { authOptions } from "@lib/auth/options";

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

export type RefreshResult =
  | { token: string; error?: undefined }
  | { token?: undefined; error: "auth_failed" | "server_unavailable" };

export async function refreshToken(): Promise<RefreshResult> {
  try {
    const res = await validateRefreshToken();

    if (!res) {
      return { error: "auth_failed" };
    }

    const access_token = await createAccessToken({ userId: res.userId });
    return { token: access_token };
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      // 4xx = auth failure (bad token, unauthorized, etc.)
      if (status && status >= 400 && status < 500) {
        return { error: "auth_failed" };
      }
      // 5xx or no response (network error) = transient
      console.error("refreshToken server error:", {
        status,
        url: error.config?.url,
      });
    } else {
      console.error("refreshToken unexpected error:", error);
    }

    return { error: "server_unavailable" };
  }
}

export async function validateRefreshToken() {
  try {
    const session = await _getServerSession(authOptions);
    if (!session?.user) throw Error("Session not found, login again");

    const cookieStore = await cookies();
    const sessionToken =
      cookieStore.get("next-auth.session-token")?.value ??
      cookieStore.get("__Secure-next-auth.session-token")?.value;

    if (!sessionToken) throw Error("Session token cookie not found");

    const token = await decode({
      token: sessionToken,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token?.refresh_token) throw Error("Token not found login again");

    const res = await axiosClient.get(`/session/token`, {
      headers: { Authorization: `Bearer ${token.refresh_token}` },
    });

    return res.data;
  } catch (error: any) {
    // Re-throw AxiosErrors for server/network issues so refreshToken can classify them
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      if (!status || status >= 500) {
        throw error;
      }
    }

    // Auth errors (missing session, cookie, token, or 4xx) → return null
    console.log("validateRefreshToken auth error:", {
      message: error?.message,
      status: error?.response?.status,
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
