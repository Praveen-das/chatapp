import { ISession } from "@repo/interfaces/sessionInterface";
import { create } from "zustand";

interface ISessionStore {
  activeSessions: ISession[];
  reset:()=>void,
  actions:{
    setActiveSessions: (sessions: ISession[]) => void;
    clearAllSessions: (currentSessionId: string) => void;
    removeSession: (sessionId: string) => void;
  }
}

export const useSessionStore = create<ISessionStore>((set, get) => {
  return {
    activeSessions: [],
    reset:()=>set({activeSessions:[]}),
    actions:{
      setActiveSessions: (activeSessions) => set({ activeSessions }),
      clearAllSessions: (currentSessionId) =>
        set((s) => ({ activeSessions: s.activeSessions.filter((s) => s.sessionId === currentSessionId) })),
      removeSession: (sessionId: string) =>
        set((s) => ({
          activeSessions: s.activeSessions.filter((s) => s.sessionId !== sessionId),
        })),
    }
  };
});
