import { create } from "zustand";
import { upsert } from "../helpers/helpers";
import { subscribeWithSelector } from 'zustand/middleware'
import { useEffect, useRef, useState } from "react";
import { shallow } from "zustand/shallow";
import { useStore } from "./global";

interface IMessageStore {
    selectedChats: IMessage[]
    setSelectedChats: (chat: IMessage | null) => void

    messageStore: IMessages
    getUserMessages: (userId: string) => IMessage[] | undefined
    setMessages: (messageStore: Map<string, IMessage[]>) => void
    setMessageStore: (userId: string, message: IMessage[] | null) => void
    updateUserMessages: (conversationId: string, updates: IUpdatesCollection[]) => void
    deleteUserMessages: (conversationId: string, updates: IUpdatesCollection[]) => void

    unreadMessages: Map<string, IUnreadMessageMeta[]>
    getUnreadMessages: (userId: string) => IUnreadMessageMeta[]
    setUnreadMessages: (userId: string, message: IUnreadMessageMeta[] | null) => void
    clearUnreadMessages: (userId?: string) => void

    updateReadReceipt: (userId: string, readReceipts: IUpdatesCollection[]) => void,

    replyRequest: IMessageReply | null
    setReplyRequest: (reply: IMessageReply | null) => void

    clearChat: (userId: string) => void
    deleteChat: (userId: string) => void

    conversations: IIConversation[],
    setConversation: (conversations: IIConversation) => void
    setConversations: (conversations: IIConversation[]) => void
}

export const useMessages = create(subscribeWithSelector<IMessageStore>((set, get) => {
    return {
        selectedChats: [],
        setSelectedChats: (chat) =>
            chat ?
                set(({ selectedChats }) => ({
                    selectedChats:
                        selectedChats.includes(chat) ? selectedChats.filter(s => s.id !== chat.id) : [...selectedChats, chat]
                })) :
                set({ selectedChats: [] })
        ,

        unreadMessages: new Map(),
        getUnreadMessages: (userId) => {
            const unreadMessages = get().unreadMessages
            return unreadMessages.get(userId) || []
        },
        setUnreadMessages: (userId, messages) => {
            const unreadMessages = get().unreadMessages

            if (!messages?.length) {
                set({ unreadMessages: new Map(unreadMessages).set(userId, []) })
                return null
            }

            unreadMessages.get(userId)?.push(...messages) ||
                unreadMessages.set(userId, messages)

            set({ unreadMessages: new Map(unreadMessages) })
        },
        clearUnreadMessages: (userId) => {
            if (userId) {
                const unreadMessages = get().unreadMessages
                unreadMessages.set(userId, [])
                return set({ unreadMessages: new Map(unreadMessages) })
            }
            set({ unreadMessages: new Map() })
        },

        messageStore: new Map(),
        getUserMessages: (userId) => {
            const messages = get().messageStore.get(userId)
            return messages
        },
        setMessageStore: (conversationId, newMessages) => {
            const messages = get().messageStore

            if (!newMessages?.length) {
                set({ messageStore: new Map(messages).set(conversationId, []) })
                return
            }

            messages.get(conversationId)?.push(...newMessages) ||
                messages.set(conversationId, newMessages)

            set({ messageStore: new Map(messages) })
        },
        setMessages: (messageStore: Map<string, IMessage[]>) => {
            set({ messageStore })
        },

        clearChat: (userId) => {
            const messageStore = get().messageStore

            messageStore.set(userId, [])

            set({ messageStore: new Map(messageStore) })
        },
        deleteChat: (userId) => {
            const messageStore = get().messageStore

            messageStore.delete(userId)

            set({ messageStore: new Map(messageStore) })
        },

        updateReadReceipt: (userId, updatesCollection) => {
            const messageStore = get().messageStore;
            const userMessages = messageStore.get(userId) || [];

            const updatedMessages = userMessages.map(message => {
                const update = updatesCollection.find(({ id }) => id === message.id);

                if (update && update.readReceipt?.length) {
                    const updatedReadReceipts = message.readReceipt.map(s => {
                        const receiptUpdate = update.readReceipt?.find(r => r.userId === s.userId);
                        return receiptUpdate ? { ...s, status: receiptUpdate.status } : s;
                    });

                    return { ...message, readReceipt: updatedReadReceipts };
                }

                return message;
            });

            const newMessageStore = new Map(messageStore);
            newMessageStore.set(userId, updatedMessages);

            set({ messageStore: newMessageStore });
        },
        updateUserMessages: (conversationId, updatesCollection) => {
            const messageStore = get().messageStore
            const userMessages = messageStore.get(conversationId) || []

            const updatedMessages = userMessages.map(message => {
                for (let { id, ...updates } of updatesCollection)
                    return message.id === id ? { ...message, ...updates } : message
            })

            set({ messageStore: new Map().set(conversationId, updatedMessages) })
        },
        deleteUserMessages: (conversationId, updatesCollection) => {
            const messageStore = get().messageStore
            const messages = messageStore.get(conversationId)?.filter(({ id }) => !updatesCollection.some(s => s.id === id)) || []

            messageStore.set(conversationId, messages)

            set({ messageStore: new Map(messageStore) })
        },

        replyRequest: null,
        setReplyRequest: (reply) => set({ replyRequest: reply }),

        conversations: [],
        setConversation: (conversation) => {
            let conversations = get().conversations
            conversations = upsert(conversations, conversation, "id")
            set({ conversations })
        },
        setConversations: (conversations) => set({ conversations })
    }
}))

export const useConversation = () => {
    const selectedConversation = useStore(s => s.selectedConversation)
    const [messages, setMessages] = useState<IMessage[]>(useMessages.getState().messageStore.get(selectedConversation?.id!) || [])
    const [unreadMessages, setUnreadMessages] = useState<IUnreadMessageMeta[]>(useMessages.getState().unreadMessages.get(selectedConversation?.id!) || [])

    const isInitital = useRef(true)
    const isInitital2 = useRef(true)

    useEffect(() => {
        const conversationId = selectedConversation?.id!

        const unsubscribe = useMessages.subscribe(
            (state) => state.messageStore.get(conversationId)?.slice() || [],
            (newValue) => {
                if (!isInitital.current) setMessages(newValue)
                isInitital.current = false
            },
            { equalityFn: shallow, fireImmediately: true }
        );

        const unsubscribe2 = useMessages.subscribe(
            (state) => state.unreadMessages.get(conversationId)?.slice() || [],
            (newValue) => {
                if (!isInitital2.current) setUnreadMessages(newValue)
                isInitital2.current = false
            },
            { equalityFn: shallow, fireImmediately: true }
        );

        return () => {
            unsubscribe()
            unsubscribe2()
            isInitital.current = false
            isInitital2.current = false
        };
    }, [selectedConversation]);

    return { messages, unreadMessages }
}

