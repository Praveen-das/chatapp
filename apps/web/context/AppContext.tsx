"use client";
import useAxios from "@hooks/useAxios";
import { getParticipant } from "@lib/conversation";
import socket from "@lib/ws";
import { IConversation } from "@interfaces/conversationInterface";
import { ISession } from "@repo/interfaces/sessionInterface";
import { PropsWithChildren, useEffect, useState } from "react";
import { useSessionStore } from "store/sessionStore";
import useSocket from "./SocketProvider";
import useAuth from "@hooks/useAuth";
import InitialLoader from "@features/ui/InitialLoader";
import { useConversationStore } from "store/conversationStore";
import { useStore } from "store/global";
import { useMessageStore } from "store/messageStore";
import { IMessage } from "@interfaces/messageInterface";
import { IUpdates } from "@repo/interfaces/messageInterface";
import { useAttachments } from "store/attachments";
import { processMessagesForUser } from "@lib/messages";
import { IMessageReadReceipt } from "enums/enums";

const { setActiveSessions, setCurrentSession } = useSessionStore.getState().actions;
const { setConversations } = useConversationStore.getState().conversationActions;
const { setUnreadMessages, setMessageHistory } = useMessageStore.getState();
const { setMediaStore } = useAttachments.getState();
const { addNewUser } = useStore.getState();

export const AppContext = ({ children }: PropsWithChildren) => {
  const { session } = useAuth();
  const { sendReadReceiptChangeRequest, sendPresence, sendConversationActivationRequest } = useSocket();
  const setIsLoaded = useConversationStore((s) => s.conversationActions.setIsLoaded);
  const isLoaded = useConversationStore((s) => s.isLoaded);
  const axios = useAxios();
  const setModal = useStore((s) => s.setModal);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    (async () => {
      const cookies = document.cookie.split(";").map((c) => c.trim());
      const invitationId = cookies.find((c) => c.startsWith("invitationId"))?.split("=")[1];

      if (invitationId) {
        setModal({
          activeModal: "joinGroupModal",
          state: { invitationId },
          open: true,
        });

        document.cookie = "invitationId=; path=/; max-age=0";
      }
    })();
  }, []);

  useEffect(() => {
    const user = session?.user;

    if (!user?.id) return;

    const conversationController = new AbortController();
    const sessionController = new AbortController();

    function initSessions(sessions: ISession[]) {
      const _sessions = sessions
        .map(
          (s) =>
            s && {
              ...s,
              self: s.sessionId === session?.sessionId,
            }
        )
        .filter((s) => s);

      _sessions.sort((a, b) => {
        if (a.self !== b.self) {
          return Number(b.self) - Number(a.self); // true (1) comes before false (0)
        }
        return b.data.timestamp - a.data.timestamp;
      });

      const [currentSession, ...activeSessions] = _sessions;

      setCurrentSession(currentSession!);
      setActiveSessions(activeSessions);

      return currentSession;
    }

    function initConversations(conversations: IConversation[]) {
      const connections: Set<string> = new Set();
      const messageStore: Map<string, IMessage[]> = new Map();
      const updatesCollection: IUpdates = new Map();
      const channels: string[] = [];
      const conversationscollection: IConversation[] = [];
      console.log(conversations)
      conversations.forEach((conversation) => {
        let conversationId = conversation.id;

        const { unreadMessages, messages, imageAttachments, urlAttachments } = processMessagesForUser(
          user!,
          IMessageReadReceipt.received,
          conversation.messages,
          updatesCollection,
          conversation
        );

        const mediaStore = { images: imageAttachments, link: urlAttachments };
        const recentMessage = messages?.at(-1);

        messageStore.set(conversationId, messages || []);

        if (!conversation.active && !!messages.length) {
          sendConversationActivationRequest(conversationId);
          conversation.active = true;
        }

        if (conversation.host === "group") {
          conversation.members.forEach((member) => {
            member.isAdmin = conversation.admins.includes(member.id!);
          });

          channels.push(conversation.channelId!);
        }

        if (conversation.host === "user") {
          const receiver = getParticipant(conversation);
          if (receiver) addNewUser(receiver);
        }

        if (conversation.host !== "system") conversation.members.forEach((c) => connections.add(c.id));

        if (recentMessage) {
          conversation.recentMessage = recentMessage;
          conversation.updatedAt = recentMessage.timestamp;
        }

        conversationscollection.push(conversation);
        setMediaStore(conversationId, mediaStore);

        !!unreadMessages.length && setUnreadMessages(conversationId, unreadMessages);

        delete conversation.messages;
      });

      setConversations(conversationscollection);
      setMessageHistory(messageStore);

      !!updatesCollection?.size && sendReadReceiptChangeRequest(updatesCollection);

      return { channels, connections };
    }

    async function init() {
      try {
        const userId = user?.id;

        const [conversations, sessions] = await Promise.all([
          axios<IConversation[]>(`/db/conversation/${userId}`, { signal: conversationController.signal }).then(
            (res) => res.data
          ),
          axios<ISession[]>(`/session/fetch?userId=${userId}`, { signal: sessionController.signal }).then(
            (res) => res.data
          ),
        ]);
        
        const currentSession = initSessions(sessions);
        const { channels, connections } = initConversations(conversations);

        sendPresence([...connections], currentSession!);

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
