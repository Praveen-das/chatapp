import { create } from "zustand";

interface IE2eeState {
  isInitialized: boolean;
  needsSetup: boolean;
  needsRestore: boolean;
  myPrivateKeyJwk: string | null;
  myPublicKeyJwk: string | null;
}

interface IE2eeActions {
  setKeys: (publicKey: string, privateKey: string) => void;
  setNeedsSetup: (needsSetup: boolean) => void;
  setNeedsRestore: (needsRestore: boolean) => void;
  clearKeys: () => void;
}

type IE2eeStore = IE2eeState & IE2eeActions;

export const useE2eeStore = create<IE2eeStore>((set) => ({
  isInitialized: false,
  needsSetup: false,
  needsRestore: false,
  myPrivateKeyJwk: null,
  myPublicKeyJwk: null,

  setKeys: (publicKey, privateKey) =>
    set({
      myPublicKeyJwk: publicKey,
      myPrivateKeyJwk: privateKey,
      isInitialized: true,
      needsSetup: false,
      needsRestore: false,
    }),

  setNeedsSetup: (needsSetup) => set({ needsSetup }),
  setNeedsRestore: (needsRestore) => set({ needsRestore }),

  clearKeys: () =>
    set({
      isInitialized: false,
      needsSetup: false,
      needsRestore: false,
      myPrivateKeyJwk: null,
      myPublicKeyJwk: null,
    }),
}));
