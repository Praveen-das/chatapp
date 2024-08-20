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
    addMembers: (conversationId: string, users: IUser[]) => void
    removeMember: (conversationId: string, userId: string, self?: boolean) => void

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

                group.admins = []
            }

            let conversations = get().conversations
            conversations = upsert(conversations, conversation, "id")
            set({ conversations })
        },
        setConversations: (conversations) => set({ conversations }),
        updateConversation: (conversationId, updates) => {
            const conversations = get().conversations
                .map(c => {
                    if (c.id === conversationId) {
                        if ('admins' in updates) {
                            let members = c.members.map((member: any) => {
                                return { ...member, isAdmin: updates.admins?.includes(member.id!) }
                            })

                            return { ...c, members }
                        }

                        return { ...c, ...updates }
                    }
                    return c
                })

            set({ conversations: conversations as IConversation[] })
        },
        addMembers: (conversationId, members) => {
            const conversations = get().conversations.map(c => {
                if (c.id === conversationId) c.members.push(...members)
                return c
            })
            set({ conversations })
        },
        removeMember: (conversationId, userId, self = false) => {
            const conversations = (get().conversations as IGroupConversation[])
                .map(c => {
                    if (c.id === conversationId) {
                        let members = c.members.filter(m => m.id !== userId)
                        // let admins = c.admins.filter(id => id !== userId)
                        if (self) return false
                        return { ...c, members }
                    }
                    return c
                })
                .filter(c => c !== false)

            set({ conversations: conversations as IConversation[] })
        },

        selectedConversation: null,
        setSelectedConversation: (conversationId) => set({ selectedConversation: get().conversations.find(s => s.id === conversationId) }),
    }
}))

export const useConversationStore = store

