import { create } from "zustand";
import { IUser, IUserRules } from "@repo/interfaces/userInterface";
import { IModal } from "@interfaces/modalInterface";
import { createIndexDBStore } from "./storeCreator";

export type UserRecord = Map<string, IUser>;

interface State {
  users: UserRecord;
  selectedUser: IUser | null;
  fetchedUser: IUser | null;
  selectedGroupMembers: IUser[];
  modal: IModal | null;
  profile: boolean;
  deviceTab: string;
  dashboardTab: string;
  uploadProgress: Map<string, number>;
}

interface Actions {
  setUsers: (users: UserRecord) => void;
  addNewUser: (user: IUser) => void;
  updateUserStatus: (userId: string, status: "online" | "offline", lastSeen?: number) => void;
  setSelectedUser: (user: IUser | null) => void;
  setFetchedUserUser: (user: IUser | null) => void;
  setSelectedGroupMembers: (id: IUser | null) => void;
  setModal: (modal: IModal | boolean | null) => void;
  setDeviceTab: (value: string) => void;
  setDashboardTab: (value: string) => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  updateUserRule: (userId: string, rule: IUserRules) => void;
  toggleProfile: (value: boolean) => void;
  profileTab: {
    push: (value: string) => void;
    back: () => void;
    getTab: () => string;
    clearHistory: () => void;
    history: string[];
  };
  reset: () => void;
}

type IGlobalStore = State & Actions;

const getInitialState = (): State => ({
  users: new Map(),
  selectedUser: null,
  fetchedUser: null,
  selectedGroupMembers: [],
  modal: null,
  profile: false,
  deviceTab: "",
  dashboardTab: "",
  uploadProgress: new Map(),
});

export const useStore = createIndexDBStore<IGlobalStore>({
  name: "userstore",
  partialize: (s) => ({ users: s.users }),
  handler: (set, get) => {
    return {
      ...getInitialState(),
      reset: () => set((s) => ({ ...getInitialState(), profileTab: { ...s.profileTab, history: [] } })),
      setUsers: (newUsers) => {
        const users = get().users;
        newUsers.forEach((value, key) => {
          users.set(key, value);
        });
        set({ users: new Map(users) });
      },
      addNewUser: (user) => {
        const users = get().users;

        if (users.has(user.id)) return;

        users.set(user.id, user);

        // users.sort((a: any, b: any) => {
        //   if (a.self) return -1;
        //   if (b.self) return 1;
        //   return a.username.localeCompare(b.username);
        // });

        set({ users });
      },
      updateUserStatus: (userId, status, lastSeen) => {
        const user = get().users.get(userId);
        if (user) {
          user.status = status;
          user.lastSeen = lastSeen ? lastSeen : user.lastSeen;
          set({ users: new Map(get().users).set(user.id, user) });
        }
      },
      updateUserRule: (userId, rule) => {
        const users = get().users;
        const user = users.get(userId);

        if (user) {
          const hasRule = user.rules?.includes(rule);

          if (hasRule) user.rules = user.rules?.filter((r) => r !== rule);
          else user.rules = [...(user.rules || []), rule];

          user.version = user.version! + 1;

          return set({ users: new Map(users).set(userId, user) });
        }
      },
      setSelectedUser: (selectedUser) => set({ selectedUser }),
      setFetchedUserUser: (fetchedUser) => set({ fetchedUser }),
      setSelectedGroupMembers: (user) => {
        const _selectedGroupMembers = get().selectedGroupMembers;

        if (!user) return set({ selectedGroupMembers: [] });

        if (_selectedGroupMembers.some((m) => m.id === user?.id)) {
          const selectedGroupMembers = _selectedGroupMembers.filter((m) => m.id !== user?.id);
          return set({ selectedGroupMembers });
        }

        set((s) => ({ selectedGroupMembers: [user, ...s.selectedGroupMembers] }));
      },
      setModal: (modal) => {
        if (typeof modal === "boolean") set((s) => ({ modal: { ...s.modal!, open: modal } }));
        else set({ modal });
      },
      toggleProfile: (value) => set((s) => ({ profile: value })),
      setDeviceTab: (value) => set({ deviceTab: value }),
      setDashboardTab: (value) => set({ dashboardTab: value }),
      setUploadProgress: (fileId, progress) =>
        set((s) => ({
          uploadProgress: new Map(s.uploadProgress).set(fileId, progress),
        })),
      profileTab: {
        push: (value) =>
          set((s) => {
            get().toggleProfile(true);
            return { profileTab: { ...s.profileTab, history: [...s.profileTab.history, value] } };
          }),
        back: () => {
          const history = get().profileTab.history;
          const toggleProfile = get().toggleProfile;

          history.pop();

          if (!!history.length) toggleProfile(true);
          else toggleProfile(false);
          set((s) => ({ profileTab: { ...s.profileTab, history } }));
        },
        getTab: () => get().profileTab.history.at(-1)!,
        clearHistory: () => set((s) => ({ profileTab: { ...s.profileTab, history: [] } })),
        history: [],
      },
    };
  },
});
