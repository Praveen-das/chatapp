import { create } from "zustand";

type AccessTokenStore = {
  accessToken: string | null;
  setAccessToken: (accessToken: string | null) => void;
};

const store = create<AccessTokenStore>((set, get) => ({
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
}));

const useAccessToken = store

export default useAccessToken;
