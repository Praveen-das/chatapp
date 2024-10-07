import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useEffect, useRef, useState } from "react";
import { shallow } from "zustand/shallow";
import { useStore } from "./global";
import { useConversationStore } from "./conversationStore";
import {
  IMessage,
  IMessages,
  IUnreadMessageMeta,
  IUpdatesCollection,
} from "../interfaces/messageInterface";
import { IDeleteForUserRequest } from "../interfaces/conversationInterface";

interface IMessageStore {
  selectedChats: IMessage[];
  setSelectedChats: (chat: IMessage | null) => void;

  messageHistory: IMessages;
  setMessageHistory: (messageHistory: Map<string, IMessage[]>) => void;
  updateUserMessageHistory: (
    conversationId: string,
    updates: IUpdatesCollection[]
  ) => void;
  deleteUserMessageHistory: (
    conversationId: string,
    updates: IUpdatesCollection[]
  ) => void;

  messageStore: IMessages;
  getUserMessages: (userId: string) => IMessage[];
  setMessages: (messageStore: Map<string, IMessage[]>) => void;
  setMessageStore: (conversationId: string, message: IMessage[] | null) => void;
  updateUserMessages: (
    conversationId: string,
    updates: IUpdatesCollection[]
  ) => void;
  deleteUserMessages: (
    conversationId: string,
    collection: IDeleteForUserRequest["collection"]
  ) => void;

  recentMessage: Map<string, IMessage | null>;
  setRecentMessage: (conversationId: string, message: IMessage | null) => void;

  unreadMessages: Map<string, IUnreadMessageMeta[]>;
  getUnreadMessages: (userId: string) => IUnreadMessageMeta[];
  setUnreadMessages: (
    userId: string,
    message: IUnreadMessageMeta[] | null
  ) => void;
  clearUnreadMessages: (userId?: string) => void;

  updateReadReceipt: (
    conversationId: string,
    readReceipts: IUpdatesCollection[]
  ) => void;

  replyRequest: IMessageReply | null;
  setReplyRequest: (reply: IMessageReply | null) => void;

  clearChat: (conversationId: string) => void;
  deleteChat: (conversationId: string) => void;
}

export const useMessageStore = create(
  subscribeWithSelector<IMessageStore>((set, get) => {
    return {
      selectedChats: [],
      setSelectedChats: (chat) =>
        chat
          ? set(({ selectedChats }) => ({
              selectedChats: selectedChats.includes(chat)
                ? selectedChats.filter((s) => s.id !== chat.id)
                : [...selectedChats, chat],
            }))
          : set({ selectedChats: [] }),
      messageHistory: new Map(),
      setMessageHistory: (messageHistory: Map<string, IMessage[]>) =>
        set({ messageHistory }),
      updateUserMessageHistory: (conversationId, updatesCollection) => {
        const messageStore = get().messageStore;
        const userMessages = messageStore.get(conversationId) || [];

        const updatedMessages = userMessages.map((message) => {
          for (let { id, ...updates } of updatesCollection)
            return message.id === id ? { ...message, ...updates } : message;
        });

        set({ messageStore: new Map().set(conversationId, updatedMessages) });
      },
      deleteUserMessageHistory: (conversationId) => {
        const messageStore = get().messageStore;

        messageStore.delete(conversationId);

        set({ messageStore: new Map(messageStore) });
      },

      unreadMessages: new Map(),
      getUnreadMessages: (userId) => {
        const unreadMessages = get().unreadMessages;
        return unreadMessages.get(userId) || [];
      },
      setUnreadMessages: (conversationId, messages) => {
        const unreadMessages = get().unreadMessages;

        if (!messages?.length) {
          set({ unreadMessages: new Map(unreadMessages).set(conversationId, []) });
          return null;
        }

        unreadMessages.get(conversationId)?.push(...messages) ||
          unreadMessages.set(conversationId, messages);

        set({ unreadMessages: new Map(unreadMessages) });
      },
      clearUnreadMessages: (userId) => {
        if (userId) {
          const unreadMessages = get().unreadMessages;
          unreadMessages.set(userId, []);
          return set({ unreadMessages: new Map(unreadMessages) });
        }
        set({ unreadMessages: new Map() });
      },

      messageStore: new Map(),
      getUserMessages: (conversationId) => {
        const messages = get().messageStore;
        return messages.get(conversationId) || [];
      },
      setMessageStore: (conversationId, newMessages) => {
        const messages = get().messageStore;

        if (!newMessages?.length) {
          set({ messageStore: new Map(messages).set(conversationId, []) });
          return;
        }

        messages.get(conversationId)?.push(...newMessages) ||
          messages.set(conversationId, newMessages);

        set({ messageStore: new Map(messages) });
      },
      setMessages: (messageStore: Map<string, IMessage[]>) => {
        set({ messageStore });
      },

      recentMessage: new Map(),
      setRecentMessage: (conversationId, recentMessage) =>
        set((s) => ({recentMessage: new Map(s.recentMessage).set(conversationId, recentMessage)})),

      clearChat: (conversationId) =>
        set((s) => ({
          messageStore: new Map(s.messageStore).set(conversationId, []),
          messageHistory: new Map(s.messageHistory).set(conversationId, []),
        })),
      deleteChat: (userId) => {
        const messageStore = get().messageStore;

        messageStore.delete(userId);

        set({ messageStore: new Map(messageStore) });
      },

      updateReadReceipt: (conversationId, updatesCollection) => {
        const { messageHistory, messageStore } = get();

        const getMessages = (store: IMessages) =>
          store.get(conversationId) || [];
        const userMessages = getMessages(messageStore);
        const userMessagesHistory = getMessages(messageHistory);

        const applyUpdatesToMessages = (messages: IMessage[]) =>
          messages.map((message) => {
            const update = updatesCollection.find(
              ({ id }) => id === message.id
            );

            if (!update || !update.readReceipt?.length) return message;

            const updatedReadReceipts = message.readReceipt.map((s) => {
              const receiptUpdate = update.readReceipt?.find(
                (r) => r.userId === s.userId
              );
              return receiptUpdate ? { ...s, status: receiptUpdate.status } : s;
            });

            return { ...message, readReceipt: updatedReadReceipts };
          });

        const updateStore = (store: IMessages, messages: IMessage[]) => {
          const updatedMessages = applyUpdatesToMessages(messages);
          const updatedStore = new Map(store).set(
            conversationId,
            updatedMessages
          );
          return updatedStore;
        };

        if (userMessages.length)
          set({ messageStore: updateStore(messageStore, userMessages) });
        else
          set({
            messageHistory: updateStore(messageHistory, userMessagesHistory),
          });
      },
      updateUserMessages: (conversationId, updatesCollection) => {
        const messageStore = get().messageStore;
        const messageHistory = get().messageHistory;

        let modified = false;

        const messages = messageStore.get(conversationId) || [];
        const history = messageHistory.get(conversationId) || [];

        const updatedMessages = messages.map((message) => {
          for (let { id, ...updates } of updatesCollection)
            if (message.id === id) {
              modified = true;
              return { ...message, ...updates };
            }
          return message;
        });

        if (!modified) {
          const updatedHistory = history.map((message) => {
            for (let { id, ...updates } of updatesCollection)
              return message.id === id ? { ...message, ...updates } : message;
          });

          return set({
            messageHistory: new Map().set(conversationId, updatedHistory),
          });
        }

        set({ messageStore: new Map().set(conversationId, updatedMessages) });
      },
      deleteUserMessages: (conversationId, updatesCollection) => {
        const messageStore = get().messageStore;
        const messageHistory = get().messageHistory;

        const messages = messageStore.get(conversationId);

        const updatedMessages =
          messages?.filter(
            ({ id }) => !updatesCollection.some((c) => c.messageId === id)
          ) || [];

        if (messages && messages?.length !== updatedMessages.length) {
          messageStore.set(conversationId, updatedMessages);
          set({ messageStore: new Map(messageStore) });
        } else {
          const history =
            messageHistory
              .get(conversationId)
              ?.filter(
                ({ id }) => !updatesCollection.some((s) => s.messageId === id)
              ) || [];
          messageHistory.set(conversationId, history);
          set({ messageHistory: new Map(messageHistory) });
        }
      },

      replyRequest: null,
      setReplyRequest: (reply) => set({ replyRequest: reply }),
    };
  })
);

export const useMessagesByConversation = () => {
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );

  const [messageHistory, setMessageHistory] = useState<IMessage[]>(
    useMessageStore.getState().messageHistory.get(selectedConversation?.id!) ||
      []
  );
  const [messages, setMessages] = useState<IMessage[]>(
    useMessageStore.getState().messageStore.get(selectedConversation?.id!) || []
  );
  const [unreadMessages, setUnreadMessages] = useState<IUnreadMessageMeta[]>(
    useMessageStore.getState().unreadMessages.get(selectedConversation?.id!) ||
      []
  );

  const isInitital = useRef(true);
  const isInitital1 = useRef(true);
  const isInitital2 = useRef(true);

  useEffect(() => {
    const conversationId = selectedConversation?.id!;

    const unsubscribe = useMessageStore.subscribe(
      (state) => state.messageHistory.get(conversationId)?.slice() || [],
      (newValue) => {
        if (!isInitital.current) setMessageHistory(newValue);
        isInitital.current = false;
      },
      { equalityFn: shallow, fireImmediately: true }
    );

    const unsubscribe1 = useMessageStore.subscribe(
      (state) => state.messageStore.get(conversationId)?.slice() || [],
      (newValue) => {
        if (!isInitital1.current) setMessages(newValue);
        isInitital1.current = false;
      },
      { equalityFn: shallow, fireImmediately: true }
    );

    const unsubscribe2 = useMessageStore.subscribe(
      (state) => state.unreadMessages.get(conversationId)?.slice() || [],
      (newValue) => {
        if (!isInitital2.current) setUnreadMessages(newValue);
        isInitital2.current = false;
      },
      { equalityFn: shallow, fireImmediately: true }
    );

    return () => {
      unsubscribe();
      unsubscribe1();
      unsubscribe2();

      isInitital.current = false;
      isInitital1.current = false;
      isInitital2.current = false;
    };
  }, [selectedConversation]);

  return { messageHistory, messages, unreadMessages };
};
