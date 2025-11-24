"use client";
import InitialLoader from "@features/ui/InitialLoader";
import useAuth from "@hooks/useAuth";
import useAxios from "@hooks/useAxios";
import { IConversation } from "@interfaces/conversationInterface";
import { IMessage } from "@interfaces/messageInterface";
import { getGlobalUsers, handleSettingGroupAdmin } from "@lib/conversation";
import { processMessagesForUser, registerMessages } from "@lib/messages";
import socket from "@lib/ws";
import { MessageReadReceipt } from "@repo/interfaces/messageInterface";
import { ISession } from "@repo/interfaces/sessionInterface";
import {
  ConversationFetchResponse,
  IIdbConversastionRecord,
  IIdbUserRecordValue,
  IdbValues,
  IdbReadReceiptRecord,
} from "@repo/interfaces/syncRegistryInterface";
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
const { setUsers } = useStore.getState();

type AppPostReq = {
  unsyncConversationsData: Record<keyof ConversationFetchResponse, IConversation[]>;
  unsyncUsersData: Record<string, IUser>;
  unsyncReadReceipts: MessageReadReceipt[];
};

export const AppContext = ({ children }: PropsWithChildren) => {
  const { session, updateSession } = useAuth();
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
        if (conversation.host !== "system") conversation.members.forEach((m) => connections.add(m.userId));
        if (conversation.host === "group") channels.push(conversation.channelId!);
      });

      return { connections, channels };
    }

    function initConversations(conversations: IConversation[]) {
      const messageStore: Map<string, IMessage[]> = new Map();
      const conversationsCollection: IConversation[] = [];
      const readReceiptUpdates: MessageReadReceipt[] = [];

      conversations.forEach((conversation) => {
        let conversationId = conversation.id;

        const { unreadMessages, messages, imageAttachments, urlAttachments } = processMessagesForUser(
          conversation.messages,
          conversation
        );

        const mediaStore = { images: imageAttachments, link: urlAttachments };
        const recentMessage = messages?.at(-1);

        messageStore.set(conversationId, messages || []);

        if (!conversation.active && !!messages.length) {
          sendConversationActivationRequest(conversationId);
          updateConversation(conversationId, { recentMessage, active: true });
        } else updateConversation(conversationId, { recentMessage });

        handleSettingGroupAdmin(conversation);

        if (recentMessage) {
          if (!!unreadMessages.length && recentMessage?.from !== user?.id)
            readReceiptUpdates.push({
              conversationId: conversation.conversationId,
              userId: user?.id!,
              senderId: recentMessage?.from!,
              lastDeliveredMessageTimestamp: recentMessage.timestamp,
            });

          conversation.recentMessage = recentMessage;
        }

        conversationsCollection.push(conversation);
        setMediaStore(conversationId, mediaStore);

        !!unreadMessages.length && setUnreadMessages(conversationId, unreadMessages);

        delete conversation.messages;
      });

      sendReadReceiptChangeRequest(readReceiptUpdates);
      setMessageHistory(messageStore);
      setConversations(conversationsCollection);
    }

    function updateMessagesForConversation(messagesCollection: IConversation[]) {
      const readReceiptUpdates: MessageReadReceipt[] = [];

      messagesCollection.forEach((c) => {
        let conversationId = c.conversationId;
        let userConversationId = c.id;

        const res = registerMessages({ messages: c.messages!, conversationId });

        if (!res) return;

        const { recentMessage } = res;

        readReceiptUpdates.push({
          conversationId: c.conversationId,
          userId: user?.id!,
          senderId: recentMessage?.from!,
          lastDeliveredMessageTimestamp: recentMessage?.timestamp,
        });

        if (!res.conversation.active) {
          sendConversationActivationRequest(userConversationId);
          updateConversation(userConversationId, { recentMessage, active: true });
        } else updateConversation(userConversationId, { recentMessage });
      });

      sendReadReceiptChangeRequest(readReceiptUpdates);
    }

    async function init() {
      try {
        const userId = user?.id;

        const idbConvRecord = useConversationStore.getState().conversations.reduce<IIdbConversastionRecord>((i, c) => {
          let meta: IdbValues = { lastKnownVersion: c.version! };
          if (c.recentMessage?.timestamp) meta.lastKnownMessageTimestamp = c.recentMessage.timestamp || c.updatedAt;
          i[c.conversationId] = meta;
          return i;
        }, {});

        const idbMembersRecord = getGlobalUsers().reduce<IIdbUserRecordValue[]>((i, user) => {
          i.push({ userId: user.id, version: user.version! });
          return i;
        }, []);

        idbMembersRecord.push({ userId: userId!, version: user?.version! });

        const idbReadReceiptRecord = useConversationStore
          .getState()
          .conversations.reduce<IdbReadReceiptRecord>((i, c) => {
            if (c.readReceipt) {
              const receipts = Object.values(c.readReceipt)
                .filter((r) => r.version !== undefined)
                .map((r) => ({ userId: r.userId, version: r.version! }));

              if (receipts.length > 0) {
                i[c.conversationId] = receipts;
              }
            }

            return i;
          }, {});

        const [unsyncEntries, sessions] = await Promise.all([
          axios
            .post<AppPostReq>(
              `/db/conversation/${userId}`,
              { idbConvRecord, idbMembersRecord, idbReadReceiptRecord },
              { signal: conversationController.signal }
            )
            .then((res) => res.data),
          axios<ISession[]>(`/session/fetch?userId=${userId}`, { signal: sessionController.signal }).then(
            (res) => res.data
          ),
        ]);

        const { unsyncConversationsData, unsyncUsersData, unsyncReadReceipts } = unsyncEntries || {
          unsyncConversationsData: null,
          unsyncUsersData: null,
        };

        if (unsyncUsersData && !!Object.values(unsyncUsersData).length) {
          const users = new Map(Object.entries(unsyncUsersData));

          if (users.has(userId!) && users.get(userId!)?.version! > user?.version!) {
            updateSession(users.get(userId!)!);
          } else {
            users.set(userId!, user!);
          }

          setUsers(users);
        }

        if (unsyncConversationsData && !!Object.values(unsyncConversationsData).length) {
          const { needSync, newEntry, messages: messagesCollection } = unsyncConversationsData;

          if (newEntry?.length > 0) initConversations(newEntry);

          if (needSync?.length > 0) upsertConversation(needSync);

          if (messagesCollection?.length > 0) updateMessagesForConversation(messagesCollection);
        }

        if (unsyncReadReceipts && !!Object.values(unsyncReadReceipts).length) {
          const updateReadReceipt = useConversationStore.getState().conversationActions.updateReadReceipt;
          unsyncReadReceipts.forEach((receipt) => {
            updateReadReceipt(receipt);
          });
        }

        if (sessions.length > 0) {
          const { currentSession, activeSessions } = initSessions(sessions);
          const storedConversations = useConversationStore.getState().conversations;

          setCurrentSession(currentSession!);
          setActiveSessions(activeSessions);

          if (storedConversations.length) {
            console.log("connecting websock");
            const { channels, connections } = getSocketMetadata(storedConversations);

            sendPresence([...connections], currentSession!);
            socket.auth = { userId, channels };
            if (!socket.connected) socket.connect();
          }
        }
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
