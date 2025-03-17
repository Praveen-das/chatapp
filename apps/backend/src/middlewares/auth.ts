import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

const ALLOWED_METHODS = ["GET","POST"]

export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log({method:req.method,path:req.path})
    if (ALLOWED_METHODS.includes(req.method) && req.path === "/user") return next();

    const header = req.headers.authorization;
    const token = header?.split(" ")[1];
    const isAuthorised = await verifyAccessToken(token);

    if (!isAuthorised) return res.sendStatus(403);
    return next();
  } catch (error) {
    console.log("verifyAuth-------------> ", error);
    return res.sendStatus(403)
  }
}
