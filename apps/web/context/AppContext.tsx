"use client";
import { refreshToken } from "@actions/session";
import useAccessToken from "@hooks/useAccessToken";
import useAxios from "@hooks/useAxios";
import { registerConversations } from "@lib/conversation";
import { dummyConversations } from "@lib/dummyData";
import { IConversation, ISystemConversation, IUserConversation } from "@repo/interfaces/conversationInterface";
import { ISession } from "@repo/interfaces/sessionInterface";
import { useSession } from "next-auth/react";
import { PropsWithChildren, useEffect, useState } from "react";
import { useSessionStore } from "store/sessionStore";
import useSocket from "./SocketProvider";
import useAuth from "@hooks/useAuth";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { IUser } from "@repo/interfaces/userInterface";
import { IMessage } from "@interfaces/messageInterface";
import { ISystemMessage } from "@repo/interfaces/messageInterface";
import socket from "@lib/ws";
import { APP_NAME } from "config/constants";

export const AppContext = ({ children }: PropsWithChildren) => {
  const { sendReadReceiptChangeRequest } = useSocket();
  const { setActiveSessions } = useSessionStore((s) => s.actions);
  const session = useSession();
  const axios = useAxios();
  const { signOut } = useAuth();

  const { setAccessToken } = useAccessToken();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function init() {
      if (session.status === "loading") return;
      if (session.status !== "authenticated") return;
      if (!session.data.user) return;
      // if (process.env.NEXT_PUBLIC_CLIENT_ONLY) return;

      try {
        const user = session.data.user;
        const userId = user.id;

        // if (true) {
        //   const message: ISystemMessage = {
        //     id: crypto.randomUUID(),
        //     conversationId: crypto.randomUUID(),
        //     to: userId,
        //     from: "system",
        //     type: "service_message",
        //     message: "asdasd asdasd",
        //     timestamp: Date.now(),
        //   };

        //   const systemConversation: ISystemConversation = {
        //     id: crypto.randomUUID(),
        //     conversationId: crypto.randomUUID(),
        //     userId: userId,
        //     host: "system",
        //     createdAt: Date.now(),
        //     updatedAt: Date.now(),
        //     recentMessage: message as IMessage,
        //     messages: [message as IMessage],
        //     active: true,
        //   };

        //   dummyConversations.push(systemConversation);
        // }

        if (process.env.NEXT_PUBLIC_CLIENT_ONLY) {
          registerConversations(dummyConversations, user);
          return;
        }

        const token = await refreshToken();

        if (!token) await signOut();

        setAccessToken(token);

        const [conversations, sessions] = await Promise.all([
          axios<IConversation[]>(`/db/conversation/${userId}`).then((res) => res.data),
          axios<ISession[]>(`/session/fetch?userId=${userId}`).then((res) => res.data),
        ]);

        const activeSessions = sessions
          .map(
            (s: ISession) =>
              s && {
                ...s,
                self: s.sessionId === session?.data?.sessionId,
              }
          )
          .filter((s) => s);

        activeSessions.sort((a: any, b: any) => b.self - a.self);

        const updates = await registerConversations(conversations, user);

        !!updates?.size && sendReadReceiptChangeRequest(updates);
        setActiveSessions(activeSessions);
        if (!socket.connected) socket.connect();
      } catch (error: any) {
        console.log("app context", error);
      } finally {
        setLoaded(true);
      }
    }

    init();

    return () => {
      setLoaded(false);
      useConversationStore.getState().reset();
      useMessageStore.getState().reset();
    };
  }, [session.data]);

  useEffect(() => {
    if (!loaded) return;
    if (Notification.permission === "default") Notification.requestPermission();
  }, [loaded]);

  return <>{children}</>;
};
