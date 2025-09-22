"use client";
import useAxios from "@hooks/useAxios";
import { registerConversations } from "@lib/conversation";
import { dummyConversations } from "@lib/dummyData";
import socket from "@lib/ws";
import { IConversation } from "@repo/interfaces/conversationInterface";
import { ISession } from "@repo/interfaces/sessionInterface";
import useSocket from "context/SocketProvider";
import { useSession } from "next-auth/react";
import { lazy, useEffect, useState } from "react";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { useSessionStore } from "store/sessionStore";
import DashboardClient from "./page-client";
import LoadingPage from "@features/ui/LoadingPage";
import axiosClient from "@lib/axiosClient";
import useSWR from "swr";
import { AxiosInstance } from "axios";

const fetch = (fetcher: AxiosInstance, url: string) => fetcher(url).then((res) => res.data);

export default function () {
  const { sendReadReceiptChangeRequest } = useSocket();
  const { setActiveSessions } = useSessionStore((s) => s.actions);
  const session = useSession();
  const axios = useAxios();

  const [loaded, setLoaded] = useState(false);

  const user = session.data?.user!;
  const userId = user?.id;

  const { data: conversations } = useSWR(userId && `/db/conversation/${userId}`, (url: string) => fetch(axios, url), {
    suspense: true,
  });
  
  // const {} = useSWR(`/session/fetch?userId=${userId}&sessionId=${session?.data?.sessionId}`, (url: string) =>
  //   fetch(axios, url)
  // );

  useEffect(() => {
    async function init() {
      if (session.status !== "authenticated") return;
      if (!session.data.user) return;
      // if (process.env.NEXT_PUBLIC_CLIENT_ONLY) return;

      try {
        const user = session.data.user;
        const userId = user.id;

        if (process.env.NEXT_PUBLIC_CLIENT_ONLY) {
          await registerConversations(dummyConversations, user);
          return;
        }

        // const [conversations, sessions] = await Promise.all([
        //   axios<IConversation[]>(`/db/conversation/${userId}`).then((res) => res.data),
        //   axios<ISession[]>(`/session/fetch?userId=${userId}&sessionId=${session?.data?.sessionId}`).then(
        //     (res) => res.data
        //   ),
        // ]);

        const updates = await registerConversations(conversations, user);

        !!updates?.size && sendReadReceiptChangeRequest(updates);

        // setActiveSessions(sessions);
        if (!socket.connected) socket.connect();
      } catch (error: any) {
        console.log("app context", error);
      } finally {
        setLoaded(true);
      }
    }

    init();

    return () => {
      useConversationStore.getState().reset();
      useMessageStore.getState().reset();
    };
  }, [conversations, session]);

  useEffect(() => {
    if (!loaded) return;
    if (Notification.permission === "default") Notification.requestPermission();
  }, [loaded]);

  return <>{<DashboardClient />}</>;
}
