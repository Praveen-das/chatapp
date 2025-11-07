"use client";
import InitialLoader from "@features/ui/InitialLoader";
import useAuth from "@hooks/useAuth";
import useAxios from "@hooks/useAxios";
import { IConversation } from "@interfaces/conversationInterface";
import { IMessage } from "@interfaces/messageInterface";
import { getParticipant } from "@lib/conversation";
import { processMessagesForUser, registerMessages } from "@lib/messages";
import socket from "@lib/ws";
import { IUpdates } from "@repo/interfaces/messageInterface";
import { ISession } from "@repo/interfaces/sessionInterface";
import {
  ConversationFetchResponse,
  IIdbConversastionRecord,
  IIdbUserRecord,
  IIdbUserRecordValue,
  IdbValues,
} from "@repo/interfaces/syncRegistryInterface";
import { ConversationEntry } from "@repo/interfaces/syncRegistryInterface.js";
import { IMessageReadReceipt } from "enums/enums";
import { PropsWithChildren, useEffect, useState } from "react";
import { useAttachments } from "store/attachments";
import { useConversationStore } from "store/conversationStore";
import { useStore } from "store/global";
import { useMessageStore } from "store/messageStore";
import { useSessionStore } from "store/sessionStore";
import useSocket from "./SocketProvider";
import { IUser } from "@repo/interfaces/userInterface";

const { setActiveSessions, setCurrentSession } = useSessionStore.getState().actions;
const { setConversations, updateConversation, upsertConversation } =
  useConversationStore.getState().conversationActions;
const { setUnreadMessages, setMessageHistory } = useMessageStore.getState();
const { setMediaStore } = useAttachments.getState();
const { addNewUser } = useStore.getState();

type AppPostReq = {
  unsyncConversationsData: Record<keyof ConversationFetchResponse, IConversation[]>;
  unsyncUsersData: IUser[];
};

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

      return { currentSession, activeSessions };
    }

    function getSocketMetadata(conversations: IConversation[]) {
      const connections: Set<string> = new Set();
      const channels: string[] = [];

      conversations.forEach((conversation) => {
        if (conversation.host !== "system") conversation.members.forEach((c) => connections.add(c.id));
        if (conversation.host === "group") channels.push(conversation.channelId!);
      });

      return { connections, channels };
    }

    function initConversations(conversations: IConversation[]) {
      const messageStore: Map<string, IMessage[]> = new Map();
      const updatesCollection: IUpdates = new Map();
      const conversationscollection: IConversation[] = [];

      conversations.forEach((conversation) => {
        let conversationId = conversation.id;

        const { unreadMessages, messages, imageAttachments, urlAttachments } = processMessagesForUser(
          conversation.messages,
          user?.id!,
          IMessageReadReceipt.received
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
        }

        if (conversation.host === "user") {
          const receiver = getParticipant(conversation);
          console.log(receiver);
          if (receiver) addNewUser(receiver);
        }

        if (recentMessage) {
          conversation.recentMessage = recentMessage;
          // conversation.updatedAt = recentMessage.timestamp;
        }

        conversationscollection.push(conversation);
        setMediaStore(conversationId, mediaStore);

        !!unreadMessages.length && setUnreadMessages(conversationId, unreadMessages);

        delete conversation.messages;
      });

      !!updatesCollection?.size && sendReadReceiptChangeRequest(updatesCollection);

      return { conversationscollection, messageStore };
    }

    async function init() {
      try {
        const userId = user?.id;

        // no conversationId required
        const idbConvRecord = useConversationStore.getState().conversations.reduce<IIdbConversastionRecord>((i, c) => {
          let meta: IdbValues = { lastKnownVersion: c.version! };
          if (c.recentMessage?.timestamp) meta.lastKnownMessageTimestamp = c.recentMessage.timestamp || c.updatedAt;
          i[c.conversationId] = meta;
          return i;
        }, {});

        const idbMembersRecord = useConversationStore.getState().conversations.reduce<IIdbUserRecordValue[]>((i, c) => {
          if (c.host === "user") {
            let member = getParticipant(c);
            if (!member) return i;
            i.push({ userId: member.id, version: member.version! });
          }
          return i;
        }, []);

        const [{ unsyncConversationsData, unsyncUsersData }, sessions] = await Promise.all([
          axios
            .post<AppPostReq>(
              `/db/conversation/${userId}`,
              { idbConvRecord, idbMembersRecord },
              { signal: conversationController.signal }
            )
            .then((res) => res.data),
          axios<ISession[]>(`/session/fetch?userId=${userId}`, { signal: sessionController.signal }).then(
            (res) => res.data
          ),
        ]);

        const { currentSession, activeSessions } = initSessions(sessions);

        setCurrentSession(currentSession!);
        setActiveSessions(activeSessions);

        if (unsyncConversationsData) {
          const { needSync, newEntry, messages } = unsyncConversationsData;

          console.log(unsyncConversationsData);

          if (!!newEntry?.length) {
            const { conversationscollection, messageStore } = initConversations(newEntry);
            setMessageHistory(messageStore);
            setConversations(conversationscollection);
          }

          if (!!needSync?.length) {
            needSync.forEach((c) => {
              upsertConversation(c);
            });
            // const { conversationscollection, messageStore } = initConversations(newEntry);
            // setMessageHistory(messageStore);
            // setConversations(conversationscollection);
          }

          if (!!messages?.length) {
            // data.conversations.forEach(setConversation);
            messages.forEach((c) => {
              let conversationId = c.conversationId;
              let userConversationId = c.id;

              const res = registerMessages({ messages: c.messages!, conversationId });

              if (!res) return;

              const { recentMessage, readReceiptUpdates } = res;

              const conversationUpdates = { recentMessage };

              if (!res.conversation.active) {
                sendConversationActivationRequest(userConversationId);
                updateConversation(userConversationId, { ...conversationUpdates, active: true });
              } else updateConversation(userConversationId, conversationUpdates);

              sendReadReceiptChangeRequest(readReceiptUpdates);
            });
          }
        }

        const storedConversations = useConversationStore.getState().conversations;

        if (storedConversations.length) {
          console.log("connecting websock");
          const { channels, connections } = getSocketMetadata(storedConversations);

          sendPresence([...connections], currentSession!);
          socket.auth = { userId, channels };
          if (!socket.connected) socket.connect();
        }
        // ////////////////////
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
  }, [socket, session?.user.id]);

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
