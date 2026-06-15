import { create } from "zustand";

interface IE2eeState {
  isInitialized: boolean;
  needsRestore: boolean;
  hasCloudBackup: boolean;
  showBackupModal: boolean;
  myPrivateKeyJwk: string | null;
  myPublicKeyJwk: string | null;
  pendingReencryptRequests: Set<string>;
}

interface IE2eeActions {
  setKeys: (publicKey: string, privateKey: string) => void;
  setNeedsRestore: (needsRestore: boolean) => void;
  setHasCloudBackup: (value: boolean) => void;
  setShowBackupModal: (show: boolean) => void;
  clearKeys: () => void;
  addPendingReencrypt: (ids: string[]) => void;
  removePendingReencrypt: (ids: string[]) => void;
}

type IE2eeStore = IE2eeState & IE2eeActions;

export const useE2eeStore = create<IE2eeStore>((set) => ({
  isInitialized: false,
  needsRestore: false,
  hasCloudBackup: false,
  showBackupModal: false,
  myPrivateKeyJwk: null,
  myPublicKeyJwk: null,
  pendingReencryptRequests: new Set<string>(),

  setKeys: (publicKey, privateKey) =>
    set({
      myPublicKeyJwk: publicKey,
      myPrivateKeyJwk: privateKey,
      isInitialized: true,
      needsRestore: false,
    }),

  setNeedsRestore: (needsRestore) => set({ needsRestore }),
  setHasCloudBackup: (value) => set({ hasCloudBackup: value }),
  setShowBackupModal: (show) => set({ showBackupModal: show }),

  addPendingReencrypt: (ids) =>
    set((state) => {
      const next = new Set(state.pendingReencryptRequests);
      ids.forEach((id) => next.add(id));
      return { pendingReencryptRequests: next };
    }),

  removePendingReencrypt: (ids) =>
    set((state) => {
      const next = new Set(state.pendingReencryptRequests);
      ids.forEach((id) => next.delete(id));
      return { pendingReencryptRequests: next };
    }),

  clearKeys: () =>
    set({
      isInitialized: false,
      needsRestore: false,
      hasCloudBackup: false,
      showBackupModal: false,
      myPrivateKeyJwk: null,
      myPublicKeyJwk: null,
      pendingReencryptRequests: new Set<string>(),
    }),
}));
