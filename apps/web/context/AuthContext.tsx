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
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";

const useContextData = () => {
  const axios = useAxios();
  const router = useRouter();
  const { data: session, update } = useSession({
    onUnauthenticated: () => {
      useStore.getState().reset();
      useAttachments.getState().reset();
      useMenu.getState().reset();
      useSearch.getState().reset();
      useSessionStore.getState().reset();
      useConversationStore.getState().reset();
      useMessageStore.getState().reset();
    },
    required: true,
  });
  const { setAccessToken } = useAccessToken();

  const [isMounted, setMounted] = useState(false);
  const user = useMemo(() => session?.user, [session]);

  useEffect(() => {
    async function init() {
      try {
        if (!user) return;
        
        const accessToken = await refreshToken();

        if (!accessToken) await signOut();

        setAccessToken(accessToken);
      } catch (error) {
        console.log("auth context", error);
      } finally {
        setMounted(true);
      }
    }

    init();
  }, [user]);

  const updateSession = async (updatedUser: IUser) => {
    await update({ user: updatedUser });
  };

  const updateUser = useCallback(
    async (key: string, value: any) => {
      try {
        const updatedUser = await axios
          .put(`/db/user`, { id: user?.id, updates: { [key]: value } })
          .then((res) => res.data);

        if (updatedUser.error) {
          if (updatedUser.error.code === 11000) {
            toast.error('Username already exists');
            return;
          }
          toast.error(updatedUser.error.message);
          return;
        }

        if (updatedUser.errors) {
          updatedUser.errors.forEach((error: any) => {
            toast.error(error.message);
          });
          return;
        }

        await updateSession(updatedUser);
        toast.success(`${key} updated successfully`);
      } catch (error) {
        console.log(error);
      }
    },
    [axios, user]
  );

  async function signOut() {
    const response = await _signOut({ callbackUrl: "/register", redirect: false });
    router.replace(response.url);
    socket.disconnect();
  }

  return {
    isMounted,
    setMounted,
    user,
    updateUser,
    updateSession,
    signOut,
    session,
  };
};

type AuthContextType = ReturnType<typeof useContextData>;

export const Context = createContext<AuthContextType | null>(null);

function AuthContext({ children }: PropsWithChildren) {
  const value = useContextData();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export default AuthContext;
