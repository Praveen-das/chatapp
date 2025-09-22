"use client";
import useAxios from "@hooks/useAxios";
import { useSearch } from "@hooks/useSearch";
import socket from "@lib/ws";
import { IUser } from "@repo/interfaces/userInterface";
import { signOut as _signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAttachments } from "store/attachments";
import { useStore } from "store/global";
import { useMenu } from "store/menu";
import { useSessionStore } from "store/sessionStore";
import { refreshToken } from "@actions/session";
import useAccessToken from "@hooks/useAccessToken";
import LoadingPage from "@features/ui/LoadingPage";

const useContextData = () => {
  const axios = useAxios();
  const { data, update, status } = useSession();
  const user = useMemo(() => data?.user, [data]);
  const router = useRouter();
  const { setAccessToken } = useAccessToken();
  const [isMounted,setMounted] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // check for session revocation
        const accessToken = await refreshToken();
        if (!accessToken) await signOut();
        setMounted(true);
        setAccessToken(accessToken);
      } catch (error) {
        console.log("auth context", error);
      }
    }

    init();
  }, []);

  const updateSession = async (updatedUser: IUser) => {
    await update({ user: updatedUser });
  };

  const updateUser = useCallback(
    async (key: string, value: any) => {
      try {
        const updatedUser = await axios
          .put(`/db/user`, { id: user?.id, updates: { [key]: value } })
          .then((res) => res.data);

        if (!updatedUser.errors) {
          await updateSession(updatedUser);
          toast.success(`${key} updated successfully`);
          return;
        }

        updatedUser.errors.forEach((error: any) => {
          toast.error(error.message);
        });
      } catch (error) {
        console.log(error);
      }
    },
    [axios, user]
  );

  async function signOut() {
    const response = await _signOut({ callbackUrl: "/register", redirect: false });
    router.replace(response.url);

    useStore.getState().reset();
    useAttachments.getState().reset();
    useMenu.getState().reset();
    useSessionStore.getState().reset();
    useSearch.getState().reset();
    socket.disconnect();
  }

  return {
    isMounted,
    user,
    updateUser,
    updateSession,
    signOut,
  };
};

type AuthContextType = ReturnType<typeof useContextData>;

export const Context = createContext<AuthContextType | null>(null);

function AuthContext({ children }: PropsWithChildren) {
  const value = useContextData();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export default AuthContext;
