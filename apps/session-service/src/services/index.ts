import { Request, Response } from "express";
import sessionStore from "../session";
import { ISession } from "@repo/interfaces/sessionInterface";

async function getAllSessions(req: Request, res: Response) {
  const sessions = await sessionStore.findAllSessions();
  res.json(sessions);
}

async function saveSession(req: Request, res: Response) {
  const session = req.body;

  session.data = JSON.stringify(session.data);

  const response = await sessionStore.saveSession(session);

  res.json("ok");
}

async function updateSession(req: Request, res: Response) {
  const session = req.body;
  const response = await sessionStore.updateSession(session);
  res.json(response);
}

async function getSession(sessionId: string) {
  const response = await sessionStore.findSession(sessionId);
  if (!response) return null;
  return response;
  // try {
  //   const session = JSON.parse(response.data!) as ISession;
  // } catch (error) {
  //   console.error("Error parsing session data:", error);
  //   return null;
  // }
}

async function getUserSessions(userId: string) {
  const response = await sessionStore.findUserSessions(userId);
  return response as any as ISession[];
}

async function deleteSession(req: Request, res: Response) {
  const sessionId = req.params.id;
  const response = await sessionStore.deleteSession(sessionId!);
  res.json(response);
}

async function clearUserSessions(req: Request, res: Response) {
  const { sessionIds, userId } = req.body;
  const response = await sessionStore.clearUserSessions(sessionIds, userId);
  res.json(response);
}

export default {
  getAllSessions,
  getSession,
  saveSession,
  updateSession,
  getUserSessions,
  deleteSession,
  clearUserSessions,
};
