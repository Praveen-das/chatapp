import { Request, Response } from "express";
import sessionServices from "../services";
import { verifyRefreshToken } from "@repo/utils";
import { ISession } from "@repo/interfaces/sessionInterface";

interface IGetSessionReq extends Request {
  query: {
    sessionId: string;
    userId: string;
  };
}

async function _getSession(req: IGetSessionReq, res: Response): Promise<any> {
  const { sessionId, userId } = req.query;

  // if (sessionId) {
  //   const session = await sessionServices.getSession(sessionId);
  //   return res.json(session);
  // }

  if (userId) {
    const response = await sessionServices.getUserSessions(userId);

    const activeSessions = response
      .map(
        (s: ISession) =>
          s && {
            ...s,
            self: s.sessionId === sessionId,
          }
      )
      .filter((s) => s);

    activeSessions.sort((a: any, b: any) => b.self - a.self);

    return res.json(activeSessions);
  }

  return res.json("no sessions found");
}

async function _refreshtoken(req: IGetSessionReq, res: Response): Promise<any> {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token not found" });

  const payload = await verifyRefreshToken(token);

  if (payload) {
    if (payload?.expired) return res.status(401).send("Token expired");

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
