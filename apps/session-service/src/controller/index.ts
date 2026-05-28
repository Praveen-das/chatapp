import { Request, Response } from "express";
import sessionService from "../services";
import { verifyRefreshToken, verifyAccessToken } from "@repo/utils";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "../utils/errors";
import { asyncHandler } from "../utils/asyncHandler";

async function getSession(req: Request, res: Response): Promise<void> {
  const { sessionId, userId } = req.query as { sessionId?: string; userId?: string };
  // Verify access token and check ownership
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Authorization required");
  }

  const payload = await verifyAccessToken(token);

  if (!payload) {
    throw new UnauthorizedError("Invalid token");
  }

  if (payload.expired) {
    throw new UnauthorizedError("Token expired");
  }

  if (userId && payload.userId !== userId) {
    throw new ForbiddenError("Forbidden: cannot access another user's sessions");
  }

  if (userId) {
    const response = await sessionService.getUserSessions(userId);
    res.json(response);
    return;
  }

  res.json("no sessions found");
}

async function refreshToken(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) {
    throw new UnauthorizedError("Token not found");
  }

  const payload = await verifyRefreshToken(token);

  if (!payload) {
    throw new UnauthorizedError("Invalid token");
  }
  if (payload.expired) {
    throw new UnauthorizedError("Token expired");
  }

  const session = await sessionService.getSession(payload.sessionId);

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  res.json(session);
}

async function saveSession(req: Request, res: Response): Promise<void> {
  const response = await sessionService.saveSession(req.body);
  res.json(response);
}

async function updateSession(req: Request, res: Response): Promise<void> {
  const response = await sessionService.updateSession(req.body);
  res.json(response);
}

async function deleteSession(req: Request, res: Response): Promise<void> {
  const sessionId = req.params.id;
  const response = await sessionService.deleteSession(sessionId!);
  res.json(response);
}

async function clearUserSessions(req: Request, res: Response): Promise<void> {
  const { sessionIds, userId } = req.body;
  const response = await sessionService.clearUserSessions(sessionIds, userId);
  res.json(response);
}

export const sessionController = {
  getSession: asyncHandler(getSession),
  refreshToken: asyncHandler(refreshToken),
  saveSession: asyncHandler(saveSession),
  updateSession: asyncHandler(updateSession),
  deleteSession: asyncHandler(deleteSession),
  clearUserSessions: asyncHandler(clearUserSessions),
};

export default sessionController;
