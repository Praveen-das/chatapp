import {
  IGroupConversation,
  IGroupMember,
  IConversation,
  IConversationBase,
} from "@repo/interfaces/conversationInterface";
import { IMessage } from "@repo/interfaces/messageInterface";
import { IUserRules } from "@repo/interfaces/userInterface";
import { createIndexDBStore } from "./storeCreator";
import { updatedDiff } from "deep-object-diff";

export type IConversationStore = {
  conversations: IConversation[];
  isHydrated: boolean;
  isLoaded: boolean;
  selectedConversation?: IConversation | null;
  conversationActions: {
    setConversation: (conversation: IConversation) => void;
    setConversations: (conversations: IConversation[]) => void;
    updateConversation: (
      userConversationId: string,
      updates: Partial<IConversationBase & { memberId: string }>
    ) => void;
    upsertConversation: (conversation: IConversation) => void;
    deleteConversation: (userConversationId: string) => void;
    // addBlockedUser: (conversationId: string, userId: string) => void;
    // removeBlockedUser: (conversationId: string, userId: string) => void;
    setSelectedConversation: (userConversationId: string | null) => void;
    addToStarred: (userConversationId: string, message: IMessage) => void;
    removeFromStarred: (userConversationId: string, messageId: string) => void;
    clearStarred: (userConversationId: string) => void;
    updateConversationRule: (userId: string, rule: IUserRules) => void;
    updateUserStatus: (userId: string, status: "online" | "offline", lastSeen?: number) => void;
    setIsLoaded: (value: boolean) => void;
    setIsHydrated: (value: boolean) => void;
  };
  groupActions: {
    updateGroupConversation: (userConversationId: string, updates: Partial<IGroupConversation>) => void;
    setAdmin: (conversationId: string, userId: string, isAdmin: boolean) => void;
    addMembers: (conversationId: string, users: IGroupMember[]) => void;
    removeMember: (conversationId: string, userId: string) => void;
    addGroupTag: (conversationId: string, tag: string) => void;
    removeGroupTag: (conversationId: string, tag: string) => void;
  };
  reset: () => void;
};

const store = createIndexDBStore<IConversationStore>({
  name: "msgstore",
  handler: (set, get) => {
    return {
      conversations: [],
      isHydrated: false,
      isLoaded: false,
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
        setConversations: (conversations) => {
          set({ conversations });
        },
        // addBlockedUser: (conversationId: string, userId: string) => {
        //   const conversations = get().conversations.map((c) => {
        //     if (c.host === "user" && c.conversationId === conversationId)
        //       return { ...c, blockedList: [...(c.blockedList || []), userId] };
        //     return c;
        //   });
        //   set({ conversations });
        // },
        // removeBlockedUser: (conversationId: string, userId: string) => {
        //   const conversations = get().conversations.map((c) => {
        //     if (c.host === "user" && c.conversationId === conversationId)
        //       return { ...c, blockedList: c.blockedList?.filter((id) => id !== userId) as [string, string] };
        //     return c;
        //   });
        //   set({ conversations });
        // },
        updateUserStatus: (userId, status, lastSeen) => {
          const conversations = get().conversations.map((c) => {
            if (c.host !== "system") {
              const members = c.members.map((m) => {
                if (m.id === userId) {
                  if (status === "offline") return { ...m, status, lastSeen };
                  return { ...m, status };
                }
                return m;
              });
              return { ...c, members };
            }
            return c;
          });

          // @ts-ignore
          set({ conversations });
        },
        updateConversationRule: (userId, rule) => {
          const conversations = get().conversations.map((c) => {
            if (c.host === "system") return c;
            let updated = false;

            const members: any = c.members.map((m) => {
              if (m.id === userId) {
                updated = true;
                const hasRule = m.rules?.includes(rule);
                if (hasRule) {
                  const filteredRules = m.rules?.filter((r) => r !== rule);
                  return { ...m, rules: filteredRules, version: m.version! + 1 };
                }

                return { ...m, rules: [...(m.rules || []), rule], version: m.version! + 1 };
              }

              return m;
            });

            if (updated) return { ...c, members, version: c.version! + 1 };
            return c;
          });

          set({ conversations });
        },
        updateConversation: (id, update) => {
          const _conversations = get().conversations;
          const conversations = _conversations.map((c) =>
            c.id === id ? { ...c, ...update, version: c.version! + 1 } : c
          );
          set({ conversations });
        },
        upsertConversation: (newConversation) => {
          const conversations = get().conversations.map((c) => {
            if (c.host !== "system" && c.id === newConversation.id) {
              let updates: Record<string, any> = {};
              let diffs = updatedDiff(c, newConversation);

              Object.keys(diffs).forEach((k) => {
                let key = k as keyof IConversation;
                updates[key] = newConversation[key];
              });

              return { ...c, ...updates };
            }
            return c;
          });

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
        setIsLoaded: (value) => set({ isLoaded: value }),
        setIsHydrated: (value) => set({ isLoaded: value }),
        clearStarred: (id) => {
          const conversations = get().conversations.map((c) => (c.id !== id ? c : { ...c, starred: [] }));
          set({ conversations });
        },
      },
      groupActions: {
        addGroupTag: (conversationId, tag) => {
          const conversations = get().conversations.map((c) => {
            if (c.id === conversationId && c.host === "group") {
              return { ...c, tags: [tag, ...(c.tags || [])], version: c.version! + 1 };
            }
            return c;
          });
          set({ conversations });
        },
        removeGroupTag: (conversationId, tag) => {
          const conversations = get().conversations.map((c) => {
            if (c.id === conversationId && c.host === "group") {
              if (c.tags) return { ...c, tags: c.tags.filter((t) => t !== tag), version: c.version! + 1 };
            }
            return c;
          });
          set({ conversations });
        },
        updateGroupConversation: (conversationId, updates) => {
          const conversations = get().conversations.map((c) => {
            if (c.id === conversationId && c.host === "group") {
              return { ...c, ...updates, version: c.version! + 1 };
            }

            return c;
          });

          set({ conversations });
        },
        setAdmin: (conversationId, userId, isAdmin) => {
          const conversations = get().conversations.map((c) => {
            if (c.conversationId === conversationId && c.host === "group") {
              const admins = isAdmin ? [...c.admins, userId] : c.admins.filter((id) => id !== userId);
              const members = c.members.map((m) => (m.id === userId ? { ...m, isAdmin } : m));
              return { ...c, members, admins, version: c.version! + 1 };
            }

            return c;
          });

          set({ conversations });
        },
        addMembers: (conversationId, members) => {
          const conversations = get().conversations.map((c) => {
            if (c.conversationId === conversationId && c.host === "group") {
              c.members.push(...members);
              c.version = c.version! + 1;
            }
            return { ...c };
          });

          set({ conversations });
        },
        removeMember: (conversationId, userId) => {
          let conversations = get().conversations.map((c) => {
            if (c.id === conversationId && c.host === "group") {
              let members = c.members.filter((m) => m.id !== userId);
              let admins = c.admins.filter((id) => id !== userId);
              return { ...c, members, admins, version: c.version! + 1 };
            }
            return c;
          });

          set({ conversations });
        },
      },
    };
  },
});

export const useConversationStore = store;
