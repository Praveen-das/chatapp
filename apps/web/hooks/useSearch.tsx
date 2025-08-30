import { create } from "zustand";
import { IQueryResult } from "@repo/interfaces/conversationInterface";

interface IStore {
  searchQuery: string;
  queryResult: IQueryResult;

  setSearchQuery: (value: string) => void;
  setQueryResult: (value: IQueryResult) => void;
  reset: () => void;
}

const queryResult = { chats: [], groups: [], contacts: [] };

export const useSearch = create<IStore>((set, get) => ({
  searchQuery: "",
  queryResult,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setQueryResult: (queryResult) => set({ queryResult }),
  reset: () => set({ searchQuery: "", queryResult }),
}));
