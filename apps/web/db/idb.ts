import { PersistStorage, StateStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import superjson from "superjson";
import { IConversationStore } from "store/conversationStore";

export const indexDBStorage: PersistStorage<Partial<IConversationStore>> = {
  getItem: async(name) => {
    const value = await get(name);
    if (!value) return null;
    const state:any = superjson.parse(value);
    return state;
  },
  setItem: async(name, value) => {
    const conversations = superjson.stringify(value);
    await set(name, conversations);
  },
  removeItem: async(name) => {
    await del(name);
  },
};
