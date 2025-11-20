import { indexDBStorage } from "db/idb";
import { create, StateCreator } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

type CreateIndexDBStoreProps<T> = { name: string; handler: StateCreator<T>; partialize?: (state: T) => Partial<T> };

export const createIndexDBStore = <T extends object>({ name, handler,partialize }: CreateIndexDBStoreProps<T>) =>
  create(
    persist(subscribeWithSelector(handler), {
      name,
      storage: indexDBStorage,
      partialize,
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
