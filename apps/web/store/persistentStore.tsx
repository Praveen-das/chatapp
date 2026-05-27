import { IUserRules } from "@repo/interfaces/userInterface";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface IUserNotificationPref {
  user: boolean;
  group: boolean;
}

interface IPersistentStoreContext {
  userNotificationPref: IUserNotificationPref;
  setUserNotificationPref: (key: string, value: boolean) => void;
  syncToken: number;
  setSyncToken: (token: number) => void;
  clockSkew: number;
  setClockSkew: (skew: number) => void;

  // setUserPref: (pref: IUserPref) => void,
  // getUserPref: (userId: string) => IUserPref,
  // updateUserPref: (userId: string, pref: IUserPref) => void,
}

export const usePersistentStore = create(
  persist<IPersistentStoreContext>(
    (set) => {
      return {
        userNotificationPref: { user: true, group: true },
        setUserNotificationPref: (key, value) =>
          set((s) => ({ userNotificationPref: { ...s.userNotificationPref, [key]: value } })),
        syncToken: 0,
        setSyncToken: (token) => set({ syncToken: token }),
        clockSkew: 0,
        setClockSkew: (skew) => set({ clockSkew: skew }),
      };
    },
    {
      name: "persistent-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
