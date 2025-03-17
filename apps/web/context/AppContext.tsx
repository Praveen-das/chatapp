"use client";

import useAuth from "@hooks/useAuth";
import { IConversation, IGroupConversation } from "@interfaces/conversationInterface";
import { IMessage, IUpdates } from "@interfaces/messageInterface";
import { processMessagesForUser } from "@lib/messages";
import { IMessageReadReceipt } from "enums/enums";
import React, { createContext, useEffect, useLayoutEffect, useState } from "react";
import { useAttachments } from "store/attachments";
import { useConversationStore } from "store/conversationStore";
import { useStore } from "store/global";
import { useMessageStore } from "store/messageStore";
import useSocket from "./SocketProvider";
import { useSessionStore } from "store/sessionStore";
import { createAccessToken } from "@actions/jwt";
import useAxios from "@hooks/useAxios";
import { ISession } from "@interfaces/sessionInterface";
import { IUser } from "@interfaces/userInterface";
import socket from "@lib/ws";

export type IContext = ReturnType<typeof useContextData>;

export const Context = createContext<IContext | null>(null);

const { setConversation } = useConversationStore.getState();
const { setUnreadMessages, setMessageHistory } = useMessageStore.getState();
const { setMediaStore } = useAttachments.getState();
const { setUsers } = useStore.getState();

const useContextData = () => {
  const axios = useAxios();
  const { user, session } = useAuth();
  const { sendReadReceiptChangeRequest } = useSocket();
  const { setActiveSessions } = useSessionStore();

  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    if (!user) return;
    setLoading(true);

    (async () => {
      const { contacts, conversations, activeSessions } = await getUserData(user.id);

      const channelIds: string[] = [];

      conversations.forEach((c) => {
        if (c && c.host === "group") channelIds.push(c.channelId!);
      });

      socket.auth = { userId: user.id, channelIds };

      setUsers(contacts);

      registerConversations(conversations);

      setActiveSessions(activeSessions);

      setLoading(false);
    })();
  }, [user, session]);

  useEffect(() => {
    if (!user) return;
    if (loading) return;

    if (Notification.permission !== "granted") Notification.requestPermission();

    if (!socket.connected) socket.connect();
  }, [user, loading]);

  function registerConversations(conversations: IConversation[]) {
    const messageStore: Map<string, IMessage[]> = new Map();
    const updatesCollection: IUpdates = new Map();

    conversations.forEach((conversation) => {
      let conversationId = conversation.id;

      const { unreadMessages, updates, messages, imageAttachments, urlAttachments } = processMessagesForUser(
        user!,
        IMessageReadReceipt.received,
        conversation.messages
      );

      if (!!updates.length) {
        updates.forEach(({ key, value }) => {
          updatesCollection.upsert(key, value);
        });
      }

      const mediaStore = { images: imageAttachments, link: urlAttachments };
      const recentMessage = messages?.at(-1);

      if (recentMessage) {
        conversation.recentMessage = recentMessage;
        conversation.updatedAt = recentMessage.timestamp;
      }

      messageStore.set(conversationId, messages || []);

      setConversation(conversation);

      setMediaStore(conversationId, mediaStore);
      !!unreadMessages.length && setUnreadMessages(conversationId, unreadMessages);

      delete conversation.messages;
    });

    setMessageHistory(messageStore);

    !!updatesCollection.size && sendReadReceiptChangeRequest(updatesCollection);
  }

  const getUserData = async (userId: string) => {
    const [contacts, conversations, groups, sessions] = await Promise.all([
      getAllContacts(),
      findUserConversations(userId),
      findUserGroups(userId),
      getUserSessions(userId),
    ]);

    const activeSessions = sessions.map((s: ISession) => ({
      ...s,
      self: s.sessionId === session?.sessionId,
    }));

    activeSessions.sort((a: any, b: any) => b.self - a.self);

    contacts.forEach((_user) => {
      _user.self = _user.id === userId;
    });

    contacts.sort((a: any, b: any) => b.self - a.self);

    // groups.forEach((group) => {
    //   socket.join(group.channelId!);
    // });

    conversations.push(...(groups as any));

    return { contacts, conversations, activeSessions };
  };

  async function getUserSessions(userId: string): Promise<ISession[]> {
    const sessions = (await axios.get(`/session/fetch?userId=${userId}`)).data;
    return sessions;
  }

  async function getAllContacts(): Promise<IUser[]> {
    return await axios(`/db/user/all`)
      .then((res) => res.data)
      .catch((err) => {
        console.log("getAllContacts----------------->", err.errors);
        return [];
      });
  }

  async function findUserGroups(userId: string): Promise<IGroupConversation[]> {
    return await axios(`/db/group/${userId}`)
      .then((res) => res.data)
      .catch((err) => {
        console.log("findUserGroups------------>", err.errors);
        return [];
      });
  }

  async function findUserConversations(userId: string): Promise<IConversation[]> {
    return await axios(`/db/conversation/${userId}`)
      .then((res) => res.data)
      .catch((err) => {
        console.log("findUserConversations----------------->", err.errors);
        return [];
      });
  }

  return { loading };
};

export default function AppContext({ children }: { children: React.ReactNode }) {
  const value = useContextData();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
