import { create } from "zustand";
import { IUser } from "../interfaces/userInterface";
import { IGroupConversation } from "../interfaces/conversationInterface";
import modals from "@components/ui/modals";
import { IModal } from "@interfaces/modalInterface";

interface IGlobalStore {
  users: IUser[];
  setUsers: (users: IUser[]) => void;
  addNewUser: (user: IUser) => void;
  updateUserRule: (userId: string, rule: IUserRules) => void;
  updateUserStatus: (
    userId: string,
    status: "online" | "offline",
    lastSeen?: number
  ) => void;

  selectedUser: IUser | null;
  setSelectedUser: (user: IUser | null) => void;

  selectedGroup: IGroupConversation | null;
  setSelectedGroup: (group: IGroupConversation | null) => void;

  selectedGroupMembers: IUser[];
  setSelectedGroupMembers: (id: IUser | null) => void;

  modal: IModal | null;
  setModal: (modal: IModal | null) => void;

  profile: boolean;
  toggleProfile: (value: boolean) => void;

  profileTab: string;
  setProfileTab: (value: string) => void;

  deviceTab: string;
  setDeviceTab: (value: string) => void;

  dashboardTab: string;
  setDashboardTab: (value: string) => void;

  uploadProgress: Map<string, number>;
  setUploadProgress: (fileId: string, progress: number) => void;

  replyMessageId: string;
  setReplyMessageId: (id: string) => void;
}

export const useStore = create<IGlobalStore>((set, get) => {
  return {
    users: [],
    setUsers: (users) => set({ users }),
    addNewUser: (user) => {
      const users = get().users;
      users.push(user);
      users.sort((a: any, b: any) => {
        if (a.self) return -1;
        if (b.self) return 1;
        return a.username.localeCompare(b.username);
      });

      set({ users: [...users] });
    },
    updateUserRule: (userId, rule) => {
      const newUsers = get().users.map((u) =>
        u.id === userId ? { ...u, rules: { ...u.rules, ...rule } } : u
      );
      set({ users: newUsers });
    },
    updateUserStatus: (userId, status, lastSeen) => {
      const newUsers = get().users.map((u) =>
        u.id === userId
          ? { ...u, status, lastSeen: lastSeen ? lastSeen : u.lastSeen }
          : u
      );
      set({ users: newUsers });
    },

    selectedUser: null,
    setSelectedUser: (selectedUser) => set({ selectedUser }),

    selectedGroup: null,
    setSelectedGroup: (group) => set({ selectedGroup: group }),

    selectedGroupMembers: [],
    setSelectedGroupMembers: (user) => {
      const _selectedGroupMembers = get().selectedGroupMembers;

      if (!user) return set({ selectedGroupMembers: [] });

      if (_selectedGroupMembers.some((m) => m.id === user?.id)) {
        const selectedGroupMembers = _selectedGroupMembers.filter(
          (m) => m.id !== user?.id
        );
        return set({ selectedGroupMembers });
      }

      set((s) => ({ selectedGroupMembers: [user, ...s.selectedGroupMembers] }));
    },

    modal: null,
    setModal: (modal) => set({ modal }),

    profile: false,
    toggleProfile: (value) => set((s) => ({ profile: value })),

    profileTab: "",
    setProfileTab: (value) => set({ profileTab: value }),

    deviceTab: "",
    setDeviceTab: (value) => set({ deviceTab: value }),

    dashboardTab: "",
    setDashboardTab: (value) => set({ dashboardTab: value }),

    uploadProgress: new Map(),
    setUploadProgress: (fileId, progress) =>
      set((s) => ({
        uploadProgress: new Map(s.uploadProgress).set(fileId, progress),
      })),
    replyMessageId: "",
    setReplyMessageId: (replyMessageId: string) => set({ replyMessageId }),
  };
});
