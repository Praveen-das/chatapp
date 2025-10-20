import { ISession } from "@repo/interfaces/sessionInterface";
import { create } from "zustand";

interface ISessionStore {
  activeSessions: ISession[];
  currentSession: ISession | null;
  reset: () => void;
  actions: {
    setActiveSessions: (sessions: ISession[]) => void;
    setCurrentSession: (session: ISession) => void;
    clearAllSessions: (currentSessionId: string) => void;
    addSession: (session: ISession) => void;
    removeSession: (sessionId: string) => void;
  };
}

export const useSessionStore = create<ISessionStore>((set, get) => {
  return {
    activeSessions: [],
    currentSession: null,
    reset: () => set({ activeSessions: [] }),
    actions: {
      setActiveSessions: (activeSessions) => set({ activeSessions }),
      setCurrentSession: (currentSession) => set({ currentSession }),
      clearAllSessions: (currentSessionId) =>
        set((s) => ({ activeSessions: s.activeSessions.filter((s) => s.sessionId === currentSessionId) })),
      addSession: (session) => set((s) => ({ activeSessions: [session,...s.activeSessions] })),
      removeSession: (sessionId: string) =>
        set((s) => ({
          activeSessions: s.activeSessions.filter((s) => s.sessionId !== sessionId),
        })),
    },
  };
});
