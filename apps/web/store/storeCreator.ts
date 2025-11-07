import { indexDBStorage } from "db/idb";
import { create, StateCreator } from "zustand";
import { persist, createJSONStorage, subscribeWithSelector } from "zustand/middleware";

export const createIndexDBStore = <T extends object>({
  name,
  handler,
}: {
  name: string;
  handler: StateCreator<T>;
}) =>
  create(
    persist(subscribeWithSelector(handler), {
      name,
      storage: indexDBStorage,
      partialize: (state: any) => ({ conversations: state.conversations }),
      onRehydrateStorage: (state) => {
        return (_, error) => {
          if (error) {
            console.error("Error rehydrating store");
          } else {
            console.log("Rehydration finished:");
          }
        };
      },
    })
  );
