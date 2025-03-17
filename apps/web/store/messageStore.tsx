import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { useEffect, useRef, useState } from "react";
import { shallow } from "zustand/shallow";
import { useStore } from "./global";
import { useConversationStore } from "./conversationStore";
import {
  IMessage,
  IMessageReply,
  IMessages,
  IReadReceiptUpdatesCollection,
  IUnreadMessageMeta,
  IUpdatesCollection,
} from "../interfaces/messageInterface";
import { IDeleteForUserRequest } from "../interfaces/conversationInterface";

interface IMessageStore {
  selectedChats: IMessage[];
  setSelectedChats: (chat: IMessage | null) => void;

  messageHistory: IMessages;
  setMessageHistory: (messageHistory: Map<string, IMessage[]>) => void;
  appendMessageHistory: (conversationId: string, messages: IMessage[]) => void;
  updateUserMessageHistory: (conversationId: string, updates: IUpdatesCollection[]) => void;
  deleteUserMessageHistory: (conversationId: string) => void;

  messageStore: IMessages;
  getUserMessages: (userId: string) => IMessage[];
  setMessages: (messageStore: Map<string, IMessage[]>) => void;
  setMessageStore: (conversationId: string, message: IMessage[] | null) => void;
  updateUserMessages: (conversationId: string, updates: IUpdatesCollection[]) => void;
  deleteUserMessages: (conversationId: string, collection: IDeleteForUserRequest["collection"]) => void;

  unreadMessages: Map<string, IMessage[]>;
  getUnreadMessages: (userId: string) => IMessage[];
  setUnreadMessages: (userId: string, message: IMessage[] | null) => void;
  clearUnreadMessages: (userId?: string) => void;

  updateReadReceipt: (conversationId: string, readReceipts: IReadReceiptUpdatesCollection[]) => void;

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
        set((s) => ({
          messageHistory: new Map([...s.messageHistory, ...messageHistory]),
        })),
      appendMessageHistory: (conversationId: string, messages: IMessage[]) =>
        set((s) => {
          if (s.messageHistory.has(conversationId)) s.messageHistory.get(conversationId)?.unshift(...messages);
          else s.messageHistory.set(conversationId, messages);

          return { messageHistory: new Map(s.messageHistory) };
        }),
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
          set({
            unreadMessages: new Map(unreadMessages).set(conversationId, []),
          });
          return null;
        }

        unreadMessages.get(conversationId)?.push(...messages) || unreadMessages.set(conversationId, messages);

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

        messages.get(conversationId)?.push(...newMessages) || messages.set(conversationId, newMessages);

        set({ messageStore: new Map(messages) });
      },
      setMessages: (messageStore: Map<string, IMessage[]>) => {
        set({ messageStore });
      },

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

        const getMessages = (store: IMessages) => store.get(conversationId) || [];

        const userMessages = getMessages(messageStore);
        const userMessagesHistory = getMessages(messageHistory);

        const applyUpdatesToMessages = (messages: IMessage[]) =>
          messages.map((message) => {
            const update = updatesCollection.find(({ id }) => id === message.id)?.readReceipt!;

            if (!update) return message;

            const updatedReadReceipts = message.readReceipt.map((receipt) => {
              return receipt.userId === update?.[0]?.userId ? { ...receipt, status: update?.[0]?.status } : receipt;
            });

            return { ...message, readReceipt: updatedReadReceipts };
          });

        const updateStore = (store: IMessages, messages: IMessage[]) => {
          const updatedMessages = applyUpdatesToMessages(messages);
          const updatedStore = new Map(store).set(conversationId, updatedMessages);
          return updatedStore;
        };

        if (userMessages.length) set({ messageStore: updateStore(messageStore, userMessages) });
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

        const updatedMessages = messages?.filter(({ id }) => !updatesCollection.some((c) => c.messageId === id)) || [];

        if (messages && messages?.length !== updatedMessages.length) {
          messageStore.set(conversationId, updatedMessages);
          const recentMessage = updatedMessages.at(-1);
          useConversationStore.getState().updateConversation(conversationId, {
            recentMessage,
            updatedAt: recentMessage?.timestamp,
          });
          set({ messageStore: new Map(messageStore) });
        } else {
          const history =
            messageHistory
              .get(conversationId)
              ?.filter(({ id }) => !updatesCollection.some((s) => s.messageId === id)) || [];

          useConversationStore.getState().updateConversation(conversationId, {
            recentMessage: history.at(-1),
          });
          messageHistory.set(conversationId, history);
          set({ messageHistory: new Map(messageHistory) });
        }
      },

      replyRequest: null,
      setReplyRequest: (reply) => set({ replyRequest: reply }),
    };
  })
);
