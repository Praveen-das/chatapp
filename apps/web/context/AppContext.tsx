"use client";
import useAxios from "@hooks/useAxios";
import { registerConversations } from "@lib/conversation";
import socket from "@lib/ws";
import { IConversation } from "@repo/interfaces/conversationInterface";
import { ISession } from "@repo/interfaces/sessionInterface";
import { PropsWithChildren, useEffect, useLayoutEffect, useState } from "react";
import { useSessionStore } from "store/sessionStore";
import useSocket from "./SocketProvider";
import useAuth from "@hooks/useAuth";
import InitialLoader from "@features/ui/InitialLoader";
import { useConversationStore } from "store/conversationStore";
import { useStore } from "store/global";
import getLocalStorage from "@lib/localStorage";
import useMessages from "@hooks/useMessages";
import { useMessageStore } from "store/messageStore";
import useMessageHistory from "@hooks/useMessageHistory";

export const AppContext = ({ children }: PropsWithChildren) => {
  const { session } = useAuth();
  const { sendReadReceiptChangeRequest, registerChannels } = useSocket();
  const { setActiveSessions } = useSessionStore((s) => s.actions);
  const setIsLoaded = useConversationStore((s) => s.conversationActions.setIsLoaded);
  const isLoaded = useConversationStore((s) => s.isLoaded);
  const axios = useAxios();
  const setModal = useStore((s) => s.setModal);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    (async () => {
      const invitationId = getLocalStorage()?.getItem("invitationId");

      if (invitationId) {
        setModal({
          activeModal: "joinGroupModal",
          state: { invitationId },
          open: true,
        });

        getLocalStorage()?.removeItem("invitationId");
      }
    })();
  }, []);

  useEffect(() => {
    const conversationController = new AbortController();
    const sessionController = new AbortController();

    async function init() {
      if (!session) return;

      try {
        const user = session.user;
        const userId = user.id;
        const channels: string[] = [];

        const [conversations, sessions] = await Promise.all([
          axios<IConversation[]>(`/db/conversation/${userId}`, { signal: conversationController.signal }).then(
            (res) => res.data
          ),
          axios<ISession[]>(`/session/fetch?userId=${userId}`, { signal: sessionController.signal }).then(
            (res) => res.data
          ),
        ]);

        if (conversations.length) {
          conversations.forEach((c) => {
            if (c.host === "group" && c.channelId) channels.push(c.channelId);
          });

          const updates = registerConversations(conversations, user);
          !!updates?.size && sendReadReceiptChangeRequest(updates);
        }

        if (!!sessions.length) {
          const activeSessions = sessions
            .map(
              (s) =>
                s && {
                  ...s,
                  self: s.sessionId === session.sessionId,
                }
            )
            .filter((s) => s);

          activeSessions.sort((a: any, b: any) => b.self - a.self);
          setActiveSessions(activeSessions);
        }

        socket.auth = { userId, channels };
        if (!socket.connected) socket.connect();
      } catch (error) {
        console.log("Sessions setter error", error);
      } finally {
        setIsLoaded(true);
      }
    }

    init();

    return () => {
      conversationController.abort();
      sessionController.abort();
    };
  }, [socket, session]);

  useEffect(() => {
    if (Notification.permission === "default") Notification.requestPermission();

    return () => {
      useConversationStore.getState().reset();
      useMessageStore.getState().reset();
      setIsLoaded(false);
      setIsMounted(false);
    };
  }, []);

  return <>{isLoaded && isMounted ? children : <InitialLoader isLoaded={isLoaded} onComplete={setIsMounted} />}</>;
};
