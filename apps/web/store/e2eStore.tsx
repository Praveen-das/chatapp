import { create } from "zustand";

interface IE2eeState {
  isInitialized: boolean;
  needsRestore: boolean;
  hasCloudBackup: boolean;
  showBackupModal: boolean;
  myPrivateKeyJwk: string | null;
  myPublicKeyJwk: string | null;
}

interface IE2eeActions {
  setKeys: (publicKey: string, privateKey: string) => void;
  setNeedsRestore: (needsRestore: boolean) => void;
  setHasCloudBackup: (value: boolean) => void;
  setShowBackupModal: (show: boolean) => void;
  clearKeys: () => void;
}

type IE2eeStore = IE2eeState & IE2eeActions;

export const useE2eeStore = create<IE2eeStore>((set) => ({
  isInitialized: false,
  needsRestore: false,
  hasCloudBackup: false,
  showBackupModal: false,
  myPrivateKeyJwk: null,
  myPublicKeyJwk: null,

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

  clearKeys: () =>
    set({
      isInitialized: false,
      needsRestore: false,
      hasCloudBackup: false,
      showBackupModal: false,
      myPrivateKeyJwk: null,
      myPublicKeyJwk: null,
    }),
}));
