import { ISession } from "@interfaces/sessionInterface";
import { IUser } from "@interfaces/userInterface";

export default function userSessionDTO(session: ISession):IUser|null {
  if (!session) return null;
  const {
    sessionId,
    browser,
    city,
    device,
    expired,
    os,
    timestamp,
    userId,
    ...rest
  } = session;

  return rest;
}
