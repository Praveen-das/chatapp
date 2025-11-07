import { create } from "zustand";
import { IUser, IUserRules } from "@repo/interfaces/userInterface";
import { IModal } from "@interfaces/modalInterface";

interface State {
  users: IUser[];
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
  setUsers: (users: IUser[]) => void;
  addNewUser: (user: IUser) => void;
  updateUserRule: (userId: string, rule: IUserRules) => void;
  updateUserStatus: (userId: string, status: "online" | "offline", lastSeen?: number) => void;
  setSelectedUser: (user: IUser | null) => void;
  setFetchedUserUser: (user: IUser | null) => void;
  setSelectedGroupMembers: (id: IUser | null) => void;
  setModal: (modal: IModal | boolean | null) => void;
  setDeviceTab: (value: string) => void;
  setDashboardTab: (value: string) => void;
  setUploadProgress: (fileId: string, progress: number) => void;
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
  users: [],
  selectedUser: null,
  fetchedUser: null,
  selectedGroupMembers: [],
  modal: null,
  profile: false,
  deviceTab: "",
  dashboardTab: "",
  uploadProgress: new Map(),
});

export const useStore = create<IGlobalStore>((set, get) => {
  return {
    ...getInitialState(),
    reset: () => set((s) => ({ ...getInitialState(), profileTab: { ...s.profileTab, history: [] } })),
    setUsers: (users) => set({ users }),
    addNewUser: (user) => {
      const users = get().users;
      if(users.some(u=>u.id === user.id)) return 
      
      users.push(user);
      users.sort((a: any, b: any) => {
        if (a.self) return -1;
        if (b.self) return 1;
        return a.username.localeCompare(b.username);
      });

      set({ users});
    },
    updateUserRule: (userId, rule) => {
      const newUsers = get().users.map((u) => (u.id === userId ? { ...u, rules: [...(u.rules || []), rule] } : u));
      set({ users: newUsers });
    },
    updateUserStatus: (userId, status, lastSeen) => {
      const newUsers = get().users.map((u) =>
        u.id === userId ? { ...u, status, lastSeen: lastSeen ? lastSeen : u.lastSeen } : u
      );
      set({ users: newUsers });
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
});
