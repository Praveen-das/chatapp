import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  IUserConversation,
  IGroupConversation,
  IGroupMember,
  IConversation,
  IConversationBase,
} from "../interfaces/conversationInterface";
import { IUser } from "../interfaces/userInterface";
import { IMessage } from "@interfaces/messageInterface";

interface IMessageStore {
  conversations: IConversation[];

  setConversation: (conversations: IConversation) => void;
  updateConversation: (
    conversationId: string,
    updates: Partial<IConversationBase>
  ) => void;
  updateGroupConversation: (
    conversationId: string,
    updates: Partial<IGroupConversation>
  ) => void;
  setAdmin: (conversationId: string, userId: string,isAdmin:boolean) => void;
  deleteConversation: (conversationId: string, userId: string) => void;

  addMembers: (conversationId: string, users: IGroupMember[]) => void;
  removeMember: (
    conversationId: string,
    userId: string,
    self?: boolean
  ) => void;

  selectedConversation: IConversation | null;
  setSelectedConversation: (conversationId: string | null) => void;
}

const store = create(
  subscribeWithSelector<IMessageStore>((set, get) => {
    return {
      conversations: [],
      setConversation: (conversation) => {
        if (conversation.host === "group") {
          conversation.members.forEach((member) => {
            member.isAdmin = conversation.admins.includes(member.id!);
          });

          conversation.admins = [];
        }

        let conversations = get().conversations;
        conversations = conversations.filter((c) => c.id !== conversation.id);
        conversations.push(conversation);

        set({ conversations });
      },
      updateGroupConversation: (conversationId, updates) => {
        const conversations = get().conversations.map((c) => {
          if (c.id === conversationId && c.host === "group") {
            // if (c.host === "group" && updates.host === 'group') {
            //   //   if ("admins" in updates) {
            //   //     let members = c.members.map((member: any) => {
            //   //       return {
            //   //         ...member,
            //   //         isAdmin: updates.admins?.includes(member.id!),
            //   //       };
            //   //     });
            //   //     return { ...c, members };
            //   //   }
            //   // return { ...c, ...updates };
            //   return { ...c, ...updates };
            // } else if(c.host === "user" && updates.host === 'user') {
            // }
            return { ...c, ...updates };
          }

          return c;
        });

        set({ conversations });
      },
      setAdmin: (conversationId, userId,isAdmin) => {
        const conversations = get().conversations.map((c) => {
          if (c.id === conversationId && c.host === "group") {
            const members = c.members.map((m) =>
              m.id === userId ? { ...m, isAdmin } : m
            );
            return { ...c, members };
          }

          return c;
        });

        set({ conversations });
      },
      updateConversation: (conversationId, updates) => {
        const _conversations = get().conversations;

        const conversations = _conversations.map((c) => {
          if (c.id === conversationId) return { ...c, ...updates };
          return c;
        });

        set({ conversations });
      },
      deleteConversation: (conversationId, userId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, deletedUsers: [...(c.deletedUsers || []), userId] }
              : c
          ),
        })),

      addMembers: (conversationId, members) => {
        const conversations = get().conversations.map((c) => {
          if (c.id === conversationId && c.host === "group")
            c.members.push(...members);
          return c;
        });
        set({ conversations });
      },
      removeMember: (conversationId, userId, self = false) => {
        let conversations;
        if (self) {
          conversations = get().conversations.filter(
            (c) => c.id !== conversationId
          );
        } else {
          conversations = get().conversations.map((c) => {
            if (c.id === conversationId && c.host === "group") {
              let members = c.members.filter((m) => m.id !== userId);
              let admins = c.admins.filter((id) => id !== userId);
              return { ...c, members, admins };
            }
            return c;
          });
        }

        set({ conversations });
      },

      selectedConversation: null,
      setSelectedConversation: (conversationId) => {
        let selectedConversation = get().conversations.find(
          (s) => s.id === conversationId
        );

        set({
          selectedConversation,
        });
      },
    };
  })
);

export const useConversationStore = store;
