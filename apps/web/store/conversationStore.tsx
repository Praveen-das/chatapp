import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  IGroupConversation,
  IGroupMember,
  IConversation,
  IConversationBase,
  ISystemConversation,
  IUserConversation,
} from "@repo/interfaces/conversationInterface";
import { IMessage } from "@repo/interfaces/messageInterface";
import { IUser, IUserRuleChangeRequest, IUserRules } from "@repo/interfaces/userInterface";

type IConversationStore = {
  conversations: IConversation[];
  isLoaded: boolean;
  selectedConversation?: IConversation | null;
  conversationActions: {
    setConversation: (conversations: IConversation) => void;
    updateConversation: (conversationId: string, updates: Partial<IConversationBase>) => void;
    deleteConversation: (conversationId: string) => void;
    setSelectedConversation: (conversationId: string | null) => void;
    addToStarred: (id: string, message: IMessage) => void;
    removeFromStarred: (id: string, messageId: string) => void;
    clearStarred: (id: string) => void;
    updateConversationRule: (userId: string, rule: IUserRuleChangeRequest["updates"]["rules"]) => void;
    updateUserStatus: (userId: string, status: "online" | "offline", lastSeen?: number) => void;
    setIsLoaded: (value:boolean) => void;
  };
  groupActions: {
    updateGroupConversation: (conversationId: string, updates: Partial<IGroupConversation>) => void;
    setAdmin: (conversationId: string, userId: string, isAdmin: boolean) => void;
    addMembers: (conversationId: string, users: IGroupMember[]) => void;
    removeMember: (conversationId: string, userId: string) => void;
    addGroupTag: (conversationId: string, tag: string) => void;
    removeGroupTag: (conversationId: string, tag: string) => void;
  };
  reset: () => void;
};

const store = create(
  subscribeWithSelector<IConversationStore>((set, get) => {
    return {
      conversations: [],
      isLoaded:false,
      selectedConversation: null,
      reset: () => set({ conversations: [], selectedConversation: null }),
      conversationActions: {
        setConversation: (conversation) => {
          if (conversation.host === "group") {
            conversation.members.forEach((member) => {
              member.isAdmin = conversation.admins.includes(member.id!);
            });
          }

          let conversations = get().conversations;
          conversations = conversations.filter((c) => c.conversationId !== conversation.conversationId);
          conversations.push(conversation);

          set({ conversations });
        },
        updateUserStatus: (userId, status, lastSeen) => {
          const conversations = get().conversations.map((c) => {
            if (c.host === "user") {
              const members = c.members.map((m) => (m.id === userId ? m : m)) as [IUser, IUser];
              return { ...c, members };
            }
            return c;
          });

          set({ conversations });
        },
        updateConversationRule: (userId, rule) => {
          const conversations = get().conversations.map((c) => {
            const members: any =
              c.host === "user" &&
              c.members.map((m) => {
                if (m.id === userId) return { ...m, rules: { ...m.rules, ...rule } };
                return m;
              });
            return { ...c, members };
          });
          set({ conversations });
        },
        updateConversation: (id, update) => {
          const _conversations = get().conversations;

          const conversations = _conversations.map((c) => (c.id === id ? { ...c, ...update } : c));

          set({ conversations });
        },
        deleteConversation: (id) => {
          const conversations = get().conversations.filter((c) => c.id !== id);
          set({ conversations });
        },
        setSelectedConversation: (conversationId) => {
          const conversations = get().conversations;

          let selectedConversation = conversations.find((s) => s.id === conversationId);

          set({
            selectedConversation,
          });
        },
        addToStarred: (id, message) => {
          function getModifiedStarredMessages<T extends IConversation>(c: T) {
            if (c.id === id) {
              const starred = [...(c.starred ?? []), message];
              return { ...c, starred } as IConversation;
            }
            return c;
          }

          const conversations = get().conversations.map((c) => getModifiedStarredMessages(c));
          set({ conversations });
        },
        removeFromStarred: (id: string, messageId: string) => {
          const conversations = get().conversations.map((conversation) => {
            if (conversation.id === id) {
              let starred = { ...conversation, starred: conversation.starred?.filter((c) => c.id !== messageId) };
              return starred as IConversation;
            }
            return conversation;
          });
          set({ conversations });
        },
        setIsLoaded:(value)=> set({isLoaded:value}),
        clearStarred: (id) => {
          const conversations = get().conversations.map((c) => (c.id !== id ? c : { ...c, starred: [] }));
          set({ conversations });
        },
      },
      groupActions: {
        addGroupTag: (conversationId, tag) => {
          const conversations = get().conversations.map((c) => {
            if (c.id === conversationId && c.host === "group") {
              return { ...c, tags: [tag, ...c.tags] };
            }
            return c;
          });
          set({ conversations });
        },
        removeGroupTag: (conversationId, tag) => {
          const conversations = get().conversations.map((c) => {
            if (c.id === conversationId && c.host === "group") {
              return { ...c, tags: c.tags.filter((t) => t !== tag) };
            }
            return c;
          });
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
              const members = c.members.map((m) => (m.id === userId ? { ...m, isAdmin } : m));
              return { ...c, members };
            }

            return c;
          });

          set({ conversations });
        },
        addMembers: (conversationId, members) => {
          const conversations = get().conversations.map((c) => {
            if (c.conversationId === conversationId && c.host === "group") c.members.push(...members);
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
      },
    };
  })
);

export const useConversationStore = store;
