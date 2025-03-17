import { Request, Response, NextFunction } from "express";
import { verify } from "../lib/jwt";

export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.method === "POST" && req.path === "/user") return next();

    const header = req.headers.authorization;
    const token = header?.split(" ")[1];
    const isAuthorised = await verify(token);

    if (!isAuthorised) return res.sendStatus(403);
    return next();
  } catch (error) {
    console.log("verifyAuth-------------> ", error);
    return res.sendStatus(403)
  }
}
