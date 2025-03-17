"use client";

import React, { createContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IUser } from "../interfaces/userInterface";
import axiosClient from "@lib/axiosClient";
import { useRouter } from "next/navigation";
import { verifyAccessToken, verifyRefreshToken } from "@actions/jwt";
import { refreshToken as _refreshToken, getRefreshToken, saveSession, updateSession } from "@actions/session";
import { ISession } from "@interfaces/sessionInterface";
import useAxios from "@hooks/useAxios";

export type IContext = ReturnType<typeof useContextData>;

export const Context = createContext<IContext | null>(null);

const useContextData = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [session, setSession] = useState<ISession | null>(null);
  const userRef = useRef<IUser | null>(null);
  const router = useRouter();

  useLayoutEffect(() => {
    (async () => {
      try {
        const {refresh_token} = (await refreshToken())!;
        const session = (await verifyRefreshToken(refresh_token))!;
        const user = session.data.userData;
        userRef.current = user;
        setUser(user);
        setSession(session);
      } catch (error) {
        console.log({ "auth context error": error });
        return null;
      }
    })();

    return () => {
      setUser(null);
    };
  }, []);

  const refreshToken = async () => {
    const session = await _refreshToken();
    if (!session) return router.push("/register");
    const access_token = session.access_token;
    setAccessToken(access_token);
    return session;
  };

  const updateUser = async (key: string, value: any) => {
    try {
      const updatedUser = await axiosClient
        .put(`/db/user/${userRef.current?.id}`, { [key]: value })
        .then((res) => res.data);

      const access_token = await updateSession(updatedUser);
      setAccessToken(access_token!);
      setUser((s) => ({ ...updatedUser }));
    } catch (error) {
      console.log(error);
    }
  };

  return {
    user,
    setUser,
    updateUser,
    session,
    accessToken,
    setAccessToken,
    refreshToken,
  };
};

export default function AuthContext({ children }: { children: React.ReactNode }) {
  const value = useContextData();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
