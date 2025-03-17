import { Request, Response } from "express";
import sessionServices from "../services";

interface SearchQuery {
  sessionId?: string;
  userId?: string;
}

async function _getSession(
  req: Request<{}, {}, {}, SearchQuery>,
  res: Response
) {
  const { sessionId, userId } = req.query;

  if (sessionId) {
    const session = await sessionServices.getSession(sessionId);
    return res.json(session);
  }

  if (userId) {
    const response = await sessionServices.getUserSessions(userId);
    return res.json(response);
  }

  return res.json("not queries found");
}

export default {
  _getSession,
};
