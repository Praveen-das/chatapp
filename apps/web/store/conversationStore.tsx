import { IGroupConversation, IGroupMember, IConversationBase } from "@repo/interfaces/conversationInterface";
import { IMessage, MessageReadReceipt } from "@repo/interfaces/messageInterface";
import { createIndexDBStore } from "./storeCreator";
import { updatedDiff } from "deep-object-diff";
import { IConversation } from "@interfaces/conversationInterface";

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
    upsertConversation: (conversations: IConversation[]) => void;
    deleteConversation: (userConversationId: string) => void;
    updateReadReceipt: (readReceipts: MessageReadReceipt) => void;
    // addBlockedUser: (conversationId: string, userId: string) => void;
    // removeBlockedUser: (conversationId: string, userId: string) => void;
    setSelectedConversation: (userConversationId: string | null) => void;
    setAiConversation: () => void;
    addToStarred: (userConversationId: string, message: IMessage) => void;
    removeFromStarred: (userConversationId: string, messageId: string) => void;
    clearStarred: (userConversationId: string) => void;
    setIsLoaded: (value: boolean) => void;
    setIsHydrated: (value: boolean) => void;
    setScrollPosition: (conversationId: string, position: number) => void;
  };
  groupActions: {
    updateGroupConversation: (userConversationId: string, updates: Partial<IGroupConversation>) => void;
    setAdmin: (conversationId: string, userId: string, isAdmin: boolean) => void;
    addMembers: (conversationId: string, users: IGroupMember[]) => void;
    removeMember: (conversationId: string, userId: string) => void;
    addGroupTag: (conversationId: string, tag: string) => void;
    removeGroupTag: (conversationId: string, tag: string) => void;
  };
  scrollPositions: Map<string, number>;
  reset: () => void;
};

const store = createIndexDBStore<IConversationStore>({
  name: "conv-store",
  handler: (set, get) => {
    return {
      conversations: [],
      isHydrated: false,
      isLoaded: false,
      selectedConversation: null,
      scrollPositions: new Map(),
      reset: () => set({ conversations: [], selectedConversation: null, scrollPositions: new Map() }),
      conversationActions: {
        setScrollPosition: (conversationId, position) => {
          set((state) => ({
            scrollPositions: new Map(state.scrollPositions).set(conversationId, position),
          }));
        },
        setConversation: (conversation) => {
          if (conversation.host === "group") {
            conversation.members.forEach((member) => {
              member.isAdmin = conversation.admins.includes(member.userId!);
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

        updateConversation: (id, update) => {
          const _conversations = get().conversations;
          const conversations = _conversations.map((c) => {
            if (c.id === id) return { ...c, ...update, version: c.version! + 1 };
            return c;
          });
          set({ conversations });
        },
        upsertConversation: (newConversations) => {
          let conversations = get().conversations;

          newConversations.forEach((conv) => {
            conversations = conversations.map((c) => {
              if ((c.host === "user" || c.host === "group") && c.id === conv.id) {
                let updates: Record<string, any> = {};
                let diffs = updatedDiff(c, conv);

                Object.keys(diffs).forEach((k) => {
                  let key = k as keyof IConversation;
                  updates[key] = conv[key];
                });

                return { ...c, ...updates };
              }
              return c;
            });
          });

          set({ conversations });
        },
        deleteConversation: (id) => {
          const conversations = get().conversations.filter((c) => c.id !== id);
          set({ conversations });
        },
        updateReadReceipt: (readReceipt) => {
          const conversations = get().conversations.map((c) => {
            if (readReceipt.conversationId === c.conversationId) {
              const userReadReceipt = c.readReceipt?.[readReceipt.userId];
              const updatedAt = readReceipt.updatedAt || Date.now();

              if (userReadReceipt) {
                const rr: Record<string, MessageReadReceipt> = {
                  ...c.readReceipt,
                  [readReceipt.userId]: { ...userReadReceipt, ...readReceipt, updatedAt },
                };

                return { ...c, readReceipt: rr };
              } else {
                const rr: Record<string, MessageReadReceipt> = {
                  ...c.readReceipt,
                  [readReceipt.userId]: { ...readReceipt, updatedAt },
                };
                return { ...c, readReceipt: rr };
              }
            }

            return c;
          });

          set({ conversations });
        },
        setSelectedConversation: (conversationId) => {
          const conversations = get().conversations;

          let selectedConversation = conversations.find((s) => s.id === conversationId);

          set({ selectedConversation });
        },
        setAiConversation: () => {
          const conversations = get().conversations;

          let selectedConversation = conversations.find((s) => s.host === "ai");

          if (!selectedConversation) {
            selectedConversation = {
              id: "ai-placeholder",
              host: "ai",
              userId: "ai",
              conversationId: "ai",
              updatedAt: Date.now(),
            } as any;
          }

          set({ selectedConversation });
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
              const members = c.members.map((m) => (m.userId === userId ? { ...m, isAdmin } : m));
              return { ...c, members, admins, version: c.version! + 1 };
            }

            return c;
          });

          set({ conversations });
        },
        addMembers: (conversationId, members) => {
          const conversations = get().conversations.map((c) => {
            if (c.conversationId === conversationId && c.host === "group") {
              const existingMembers = c.members ?? [];
              const newMembers = [...existingMembers, ...members];
              return { ...c, members: newMembers, version: (c.version ?? 0) + 1 };
            }
            return c;
          });

          set({ conversations });
        },
        removeMember: (conversationId, userId) => {
          let conversations = get().conversations.map((c) => {
            if (c.id === conversationId && c.host === "group") {
              let members = c.members.filter((m) => m.userId !== userId);
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
  partialize: (state) => ({ conversations: state.conversations }),
});

export const useConversationStore = store;
