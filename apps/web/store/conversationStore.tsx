import { create } from "zustand";
import { upsert } from "../helpers/helpers";
import { subscribeWithSelector } from 'zustand/middleware'
import { useEffect, useRef, useState } from "react";
import { shallow } from "zustand/shallow";
import { useStore } from "./global";

interface IMessageStore {
    conversations: IConversation[],
    setConversation: (conversations: IConversation) => void
    setConversations: (conversations: IConversation[]) => void
    updateConversation: (conversationId: string, updates: Partial<IGroupConversation>) => void
    addMembers: (conversation: IGroupConversation, users: IUser[]) => void
    // removeMember: (conversationId: string, updates: Partial<IGroupConversation>) => void

    selectedConversation: IConversation | IGroupConversation | null
    setSelectedConversation: (conversationId: string | null) => void
}

const store = create(subscribeWithSelector<IMessageStore>((set, get) => {
    return {
        conversations: [],
        setConversation: (conversation) => {

            if (conversation.host === 'group') {
                const group = conversation as IGroupConversation
                group.members.forEach((member) => {
                    member.isAdmin = group.admins.includes(member.id!)
                })
            }

            let conversations = get().conversations
            conversations = upsert(conversations, conversation, "id")
            set({ conversations })
        },
        setConversations: (conversations) => set({ conversations }),
        updateConversation: (conversationId, updates) => {
            const conversations = get().conversations.map(c => {
                if (c.id === conversationId)
                    return { ...c, ...updates }
                return c
            })

            set({ conversations })
        },
        addMembers: (conversation, users: IUser[]) => {
            const conversations = get().conversations

            const conversationExist = conversations.find(c => c.id === conversation.id)

            if (!conversationExist) conversations.push(conversation)

            const newConversation = conversations.map(c => {
                if (c.id === conversation.id) c.members.push(...users)
                return c
            })

            set({ conversations: newConversation })
        },

        selectedConversation: null,
        setSelectedConversation: (conversationId) => set({ selectedConversation: get().conversations.find(s => s.id === conversationId) }),
    }
}))

export const useConversationStore = store

