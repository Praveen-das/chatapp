import sessionStore from "../session";
import { ISession } from "@repo/interfaces/sessionInterface";

async function getAllSessions(): Promise<any[]> {
  const sessions = await sessionStore.findAllSessions();
  return sessions;
}

async function saveSession(session: ISession): Promise<string> {
  const sessionToSave = {
    ...session,
    data: typeof session.data === "string" ? session.data : JSON.stringify(session.data),
  };
  await sessionStore.saveSession(sessionToSave as any);
  return "ok";
}

async function updateSession(session: ISession): Promise<any> {
  const sessionToUpdate = {
    ...session,
    data: typeof session.data === "string" ? session.data : JSON.stringify(session.data),
  };
  const response = await sessionStore.updateSession(sessionToUpdate as any);
  return response;
}

async function getSession(sessionId: string): Promise<ISession | null> {
  const response = await sessionStore.findSession(sessionId);
  if (!response) return null;

  const session = { ...response };
  if (session.data && typeof session.data === "string") {
    try {
      session.data = JSON.parse(session.data);
    } catch (error) {
      console.error("Error parsing session data:", error);
    }
  }
  return session as unknown as ISession;
}

async function getUserSessions(userId: string): Promise<ISession[]> {
  const response = await sessionStore.findUserSessions(userId);
  return response as unknown as ISession[];
}

async function deleteSession(sessionId: string): Promise<any> {
  const response = await sessionStore.deleteSession(sessionId);
  return response;
}

async function clearUserSessions(sessionIds: string[], userId: string): Promise<any> {
  const response = await sessionStore.clearUserSessions(sessionIds, userId);
  return response;
}

export const sessionService = {
  getAllSessions,
  getSession,
  saveSession,
  updateSession,
  getUserSessions,
  deleteSession,
  clearUserSessions,
};

export default sessionService;
