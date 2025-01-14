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
  deleteConversation: (conversationId: string) => void;
  updateGroupConversation: (
    conversationId: string,
    updates: Partial<IGroupConversation>
  ) => void;
  setAdmin: (conversationId: string, userId: string, isAdmin: boolean) => void;

  addMembers: (conversationId: string, users: IGroupMember[]) => void;
  removeMember: (conversationId: string, userId: string) => void;

  selectedConversation: IConversation | null;
  setSelectedConversation: (conversationId: string | null) => void;

  addToStarred: (id: string, message: IMessage[]) => void;
  removeFromStarred: (id: string, messageId: string) => void;
  clearStarred: (id: string) => void;
  updateConversationRule: (userId: string, rule: IUserRules) => void;

  updateUserStatus: (
    userId: string,
    status: "online" | "offline",
    lastSeen?: number
  ) => void;
}

const store = create(
  subscribeWithSelector<IMessageStore>((set, get) => {
    return {
      updateUserStatus: (userId, status, lastSeen) => {
        const conversations = get().conversations.map((c) => {
          if (c.host === "user")
            return {...c,members:c.members.map(
              (m) => m.id === userId ? { ...m, status,lastSeen:lastSeen||m.lastSeen } : m
            )};
          return c;
        });
        set({conversations})
      },
      updateConversationRule: (userId, rule) => {
        const conversations = get().conversations.map((c) => {
          const members: any = c.members.map((m) => {
            if (m.id === userId)
              return { ...m, rules: { ...m.rules, ...rule } };
            return m;
          });
          return { ...c, members };
        });
        set({ conversations });
      },

      conversations: [],
      setConversation: (conversation) => {
        if (conversation.host === "group") {
          conversation.members.forEach((member) => {
            member.isAdmin = conversation.admins.includes(member.id!);
          });
        }

        let conversations = get().conversations;
        conversations = conversations.filter(
          (c) => c.conversationId !== conversation.conversationId
        );
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
      setAdmin: (conversationId, userId, isAdmin) => {
        const conversations = get().conversations.map((c) => {
          if (c.conversationId === conversationId && c.host === "group") {
            const members = c.members.map((m) =>
              m.id === userId ? { ...m, isAdmin } : m
            );
            return { ...c, members };
          }

          return c;
        });

        set({ conversations });
      },
      updateConversation: (id, updates) => {
        const _conversations = get().conversations;

        const conversations = _conversations.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        );

        set({ conversations });
      },
      deleteConversation: (id) => {
        const conversations = get().conversations.filter((c) => c.id !== id);
        set({ conversations });
      },

      addMembers: (conversationId, members) => {
        const conversations = get().conversations.map((c) => {
          if (c.conversationId === conversationId && c.host === "group")
            c.members.push(...members);
          return c;
        });

        set({ conversations });
      },
      removeMember: (conversationId, userId) => {
        let conversations = get().conversations.map((c) => {
          if (c.id === conversationId && c.host === "group") {
            let members = c.members.filter((m) => m.id !== userId);
            let admins = c.admins.filter((id) => id !== userId);
            return { ...c, members, admins };
          }
          return c;
        });

        set({ conversations });
      },

      selectedConversation: null,
      setSelectedConversation: (conversationId) => {
        const conversations = get().conversations;

        let selectedConversation = conversations.find(
          (s) => s.id === conversationId
        );

        set({
          selectedConversation,
        });
      },

      addToStarred: (id, messages) => {
        const conversations = get().conversations.map((c) =>
          c.id === id
            ? {
                ...c,
                starred: !!c.starred?.length
                  ? [...c.starred!, ...messages]
                  : [...messages],
              }
            : c
        );
        set({ conversations });
      },
      removeFromStarred: (id: string, messageId: string) => {
        const conversations = get().conversations.map((c) =>
          c.id !== id
            ? c
            : { ...c, starred: c.starred?.filter((c) => c.id !== messageId) }
        );
        set({ conversations });
      },
      clearStarred: (id) => {
        const conversations = get().conversations.map((c) =>
          c.id !== id ? c : { ...c, starred: [] }
        );
        set({ conversations });
      },
    };
  })
);

export const useConversationStore = store;
