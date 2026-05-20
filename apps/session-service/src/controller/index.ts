import { Request, Response } from "express";
import sessionServices from "../services";
import { verifyRefreshToken, verifyAccessToken } from "@repo/utils";
import { ISession } from "@repo/interfaces/sessionInterface";

interface IGetSessionReq extends Request {
  query: {
    sessionId: string;
    userId: string;
  };
}

async function _getSession(req: IGetSessionReq, res: Response): Promise<any> {
  const { sessionId, userId } = req.query;

  // Verify access token and check ownership
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authorization required" });

  const payload = await verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid token" });
  if (payload.expired) return res.status(401).json({ error: "Token expired" });

  if (userId && payload.userId !== userId) {
    return res.status(403).json({ error: "Forbidden: cannot access another user's sessions" });
  }

  // if (sessionId) {
  //   const session = await sessionServices.getSession(sessionId);
  //   return res.json(session);
  // }

  if (userId) {
    const response = await sessionServices.getUserSessions(userId);
    return res.json(response);
  }

  return res.json("no sessions found");
}

async function _refreshtoken(req: IGetSessionReq, res: Response): Promise<any> {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token not found" });

  const payload = await verifyRefreshToken(token);

  if (payload) {
    if (payload.expired) return res.status(401).send("Token expired");

    const session = await sessionServices.getSession(payload.sessionId);

    if (!session) return res.status(404).json("Session not found");

    return res.json(session);
  }

  return res.status(401).json("Invalid token");
}

export default {
  _getSession,
  _refreshtoken,
};
