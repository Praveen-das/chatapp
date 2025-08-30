import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@repo/utils";

const ALLOWED_METHODS = ["GET", "POST"];

export async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (ALLOWED_METHODS.includes(req.method) && req.path === "/user") return next();

    const header = req.headers.authorization;
    const token = header?.split(" ")[1];

    if(token) {
      const payload = await verifyAccessToken(token!);
  
      if (payload) {
        if (payload.expired) return res.status(401).send("Token expired");
        return next();
      }
    }

    return res.sendStatus(401);
  } catch (error:any) {
    console.log("verifyAuth-------------> ", error);
    return res.status(403).send(error.message);
  }
}
