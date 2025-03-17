import { create } from "zustand";
import { IUser } from "../interfaces/userInterface";
import { IGroupConversation, IQueryResult } from "../interfaces/conversationInterface";
import modals from "@features/ui/modals";
import { IModal } from "@interfaces/modalInterface";

interface IStore {
  searchQuery: string;
  setSearchQuery: (value: string) => void;

  queryResult: IQueryResult;
  setQueryResult: (value: IQueryResult) => void;
}

export const useSearch = create<IStore>((set, get) => ({
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  queryResult: {chats: [],groups: []},
  setQueryResult: (queryResult) => set({ queryResult }),
}));
