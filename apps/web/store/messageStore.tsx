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
} from "@repo/interfaces/messageInterface";
import { IDeleteForUserRequest } from "@repo/interfaces/conversationInterface";
import { createIndexDBStore } from "./storeCreator";
import { generateAiMessageTemplate } from "@lib/messages";
import { IConversation } from "@interfaces/conversationInterface";

interface State {
  selectedChats: IMessage[];
  messageHistory: IMessages;
  messageStore: IMessages;
  unreadMessages: IMessages;
  replyRequest: IMessageReply | null;
  waitingDecryptionIds: Set<string>;
}

interface Actions {
  setSelectedChats: (chat: IMessage | null) => void;
  setMessageHistory: (messageHistory: IMessages) => void;
  appendMessageHistory: (conversationId: string, messages: IMessage[]) => void;
  updateUserMessageHistory: (conversationId: string, updates: IUpdatesCollection[]) => void;
  deleteUserMessageHistory: (conversationId: string) => void;
  getUserMessages: (userId: string) => IMessage[];
  setMessages: (messageStore: IMessages) => void;
  setMessageStore: (conversationId: string, message: IMessage[] | null) => void;
  updateUserMessages: (conversationId: string, updates: IUpdatesCollection[]) => void;
  deleteUserMessages: (conversationId: string, collection: IDeleteForUserRequest["collection"]) => void;
  upsertMessage: (res: { conversation: IConversation; messageId: string; message: string; status: string }) => void;
  getUnreadMessages: (userId: string) => IMessage[];
  setUnreadMessages: (userId: string, message: IMessage[] | null) => void;
  clearUnreadMessages: (conversationId?: string) => void;
  // updateReadReceipt: (conversationId: string, readReceipts: IReadReceiptUpdatesCollection[]) => void;
  setReplyRequest: (reply: IMessageReply | null) => void;
  clearChat: (conversationId: string) => void;
  deleteChat: (conversationId: string) => void;
  addWaitingDecryptionIds: (ids: string[]) => void;
  removeWaitingDecryptionIds: (ids: string[]) => void;
  reset: () => void;
}

type IMessageStore = State & Actions;

const getInitialState = (): State => ({
  selectedChats: [],
  messageHistory: new Map(),
  unreadMessages: new Map(),
  messageStore: new Map(),
  replyRequest: null,
  waitingDecryptionIds: new Set(),
});

export const useMessageStore = createIndexDBStore<IMessageStore>({
  name: "msg-store",
  partialize: (state) => ({
    messageHistory: state.messageHistory,
    messageStore: state.messageStore,
    unreadMessages: state.unreadMessages,
    waitingDecryptionIds: state.waitingDecryptionIds,
  }),
  handler: (set, get) => {
    return {
      ...getInitialState(),
      reset: () => set(getInitialState()),
      setSelectedChats: (chat) =>
        chat
          ? set(({ selectedChats }) => ({
              selectedChats: selectedChats.includes(chat)
                ? selectedChats.filter((s) => s.id !== chat.id)
                : [...selectedChats, chat],
            }))
          : set({ selectedChats: [] }),
      setMessageHistory: (messages: IMessages) =>
        set((s) => {
          const messageHistory = new Map(s.messageHistory);

          Array.from(messages.entries()).forEach(([conversationId, newMessages]) => {
            let existingMessages = messageHistory.get(conversationId);
            if (existingMessages) messageHistory.set(conversationId, [...existingMessages, ...newMessages]);
            else messageHistory.set(conversationId, newMessages);
          });

          return { messageHistory };
        }),
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
        const msgs = messageStore.get(conversationId) || [];
        const nextWaiting = new Set(get().waitingDecryptionIds);
        msgs.forEach((m) => nextWaiting.delete(m.id));
        messageStore.delete(conversationId);

        set({ messageStore: new Map(messageStore), waitingDecryptionIds: nextWaiting });
      },

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
      clearUnreadMessages: (conversationId) => {
        if (conversationId) {
          const unreadMessages = get().unreadMessages;
          unreadMessages.set(conversationId, []);
          return set({ unreadMessages: new Map(unreadMessages) });
        }
        set({ unreadMessages: new Map() });
      },

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

        const currentMessages = messages.get(conversationId) || [];
        const updatedMessages = [...currentMessages, ...newMessages]; // Append new messages

        set({ messageStore: new Map(messages).set(conversationId, updatedMessages) });
      },
      setMessages: (messageStore: IMessages) => {
        set({ messageStore });
      },

      clearChat: (conversationId) =>
        set((s) => {
          const msgs = s.messageStore.get(conversationId) || [];
          const hist = s.messageHistory.get(conversationId) || [];
          const nextWaiting = new Set(s.waitingDecryptionIds);
          msgs.forEach((m) => nextWaiting.delete(m.id));
          hist.forEach((m) => nextWaiting.delete(m.id));
          return {
            messageStore: new Map(s.messageStore).set(conversationId, []),
            messageHistory: new Map(s.messageHistory).set(conversationId, []),
            waitingDecryptionIds: nextWaiting,
          };
        }),
      deleteChat: (userId) => {
        const messageStore = get().messageStore;
        const msgs = messageStore.get(userId) || [];
        const nextWaiting = new Set(get().waitingDecryptionIds);
        msgs.forEach((m) => nextWaiting.delete(m.id));
        messageStore.delete(userId);

        set({ messageStore: new Map(messageStore), waitingDecryptionIds: nextWaiting });
      },

      // updateReadReceipt: (conversationId, updatesCollection) => {
      //   const { messageHistory, messageStore } = get();

      //   const getMessages = (store: IMessages) => store.get(conversationId) || [];

      //   const userMessages = getMessages(messageStore);
      //   const userMessagesHistory = getMessages(messageHistory);

      //   const applyUpdatesToMessages = (messages: IMessage[]) =>
      //     messages.map((message) => {
      //       const update = updatesCollection.find(({ id }) => id === message.id)?.readReceipt!;

      //       if (!update) return message;

      //       const updatedReadReceipts = message.readReceipt.map((receipt) => {
      //         return receipt.userId === update?.[0]?.userId ? { ...receipt, status: update?.[0]?.status } : receipt;
      //       });

      //       return { ...message, readReceipt: updatedReadReceipts };
      //     });

      //   const updateStore = (store: IMessages, messages: IMessage[]) => {
      //     const updatedMessages = applyUpdatesToMessages(messages);
      //     const updatedStore = new Map(store).set(conversationId, updatedMessages);
      //     return updatedStore;
      //   };

      //   if (userMessages.length) set({ messageStore: updateStore(messageStore, userMessages) });
      //   else
      //     set({
      //       messageHistory: updateStore(messageHistory, userMessagesHistory),
      //     });
      // },
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
              if (message.id === id) {
                return { ...message, ...updates };
              }
            return message;
          });

          return set({
            messageHistory: new Map(messageHistory).set(conversationId, updatedHistory),
          });
        }

        set({ messageStore: new Map(messageStore).set(conversationId, updatedMessages) });
      },
      deleteUserMessages: (conversationId, updatesCollection) => {
        const { updateConversation } = useConversationStore.getState().conversationActions;
        const messageStore = get().messageStore;
        const messageHistory = get().messageHistory;

        const messages = messageStore.get(conversationId);

        const updatedMessages = messages?.filter(({ id }) => !updatesCollection.some((c) => c.messageId === id)) || [];

        const deletedIds = updatesCollection.map((c) => c.messageId);
        const nextWaiting = new Set(get().waitingDecryptionIds);
        deletedIds.forEach((id) => nextWaiting.delete(id));

        if (messages && messages?.length !== updatedMessages.length) {
          messageStore.set(conversationId, updatedMessages);
          const recentMessage = updatedMessages.at(-1);
          updateConversation(conversationId, {
            recentMessage,
            updatedAt: recentMessage?.timestamp,
          });
          set({ messageStore: new Map(messageStore), waitingDecryptionIds: nextWaiting });
        } else {
          const history =
            messageHistory
              .get(conversationId)
              ?.filter(({ id }) => !updatesCollection.some((s) => s.messageId === id)) || [];

          updateConversation(conversationId, {
            recentMessage: history.at(-1),
          });
          messageHistory.set(conversationId, history);
          set({ messageHistory: new Map(messageHistory), waitingDecryptionIds: nextWaiting });
        }
      },
      upsertMessage: ({ conversation, messageId, message, status }) => {
        const messageStore = get().messageStore;
        const conversationId = conversation.id;

        const messages = messageStore.get(conversationId) || [];
        const index = messages.findIndex((m) => m.id === messageId);

        if (index !== -1) {
          let updatedMessage: IMessage = messages.at(index)!;

          if (status === "text-delta") updatedMessage = { ...updatedMessage, message };
          if (status === "text-end") updatedMessage.type = "message";

          messages[index] = updatedMessage;
          set({ messageStore: new Map(messageStore).set(conversationId, messages) });
          return;
        }

        // const newMessage = generateAiMessageTemplate(conversation, messageId);

        // set({
        //   messageStore: new Map(messageStore).set(conversationId, [...messages, newMessage]),
        // });
      },

      setReplyRequest: (reply) => set({ replyRequest: reply }),
      addWaitingDecryptionIds: (ids) =>
        set((state) => {
          const next = new Set(state.waitingDecryptionIds);
          ids.forEach((id) => next.add(id));
          return { waitingDecryptionIds: next };
        }),
      removeWaitingDecryptionIds: (ids) =>
        set((state) => {
          const next = new Set(state.waitingDecryptionIds);
          ids.forEach((id) => next.delete(id));
          return { waitingDecryptionIds: next };
        }),
    };
  },
});
