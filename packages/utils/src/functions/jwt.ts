import { ISession } from "@repo/interfaces/sessionInterface";
import { SignJWT, jwtVerify } from "jose";
import { JWSInvalid, JWSSignatureVerificationFailed, JWTExpired } from "jose/errors";

const USER_TOKEN_SECRET_KEY = new TextEncoder().encode(process.env.JWT_USER_TOKEN_SECRET_KEY);
const REFRESH_TOKEN_SECRET_KEY = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN_SECRET_KEY);
const ACCESS_TOKEN_SECRET_KEY = new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN_SECRET_KEY);

export async function createUserToken(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20sec")
    .sign(USER_TOKEN_SECRET_KEY);
}

export async function verifyUserToken(token: any) {
  try {
    const { payload } = await jwtVerify(token, USER_TOKEN_SECRET_KEY, { algorithms: ["HS256"] });
    return payload;
  } catch (error: any) {
    if (error.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
      console.log("verifyUserToken --> JWSSignatureVerificationFailed");
      return null;
    } else {
      console.log("verifyUserToken other error----->", error);
    }
    return null;
  }
}

export async function createRefreshToken(payload: any) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().sign(REFRESH_TOKEN_SECRET_KEY);
}

export async function createAccessToken(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20min")
    .sign(ACCESS_TOKEN_SECRET_KEY);
}

export async function verifyAccessToken(token: string) {
  try {
    if (!process.env.JWT_ACCESS_TOKEN_SECRET_KEY) throw new Error("JWT_ACCESS_TOKEN_SECRET_KEY not found");

    const { payload } = await jwtVerify<ISession>(token, ACCESS_TOKEN_SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    if (error instanceof JWSSignatureVerificationFailed)
      console.log("verifyAccessToken --- > JWSSignatureVerificationFailed");
    else if (error instanceof JWTExpired) {
      console.log({ errrrrrrrrrrrrr_verifyAccessToken_JWTExpired: error.code });
      return { ...(error.payload as unknown as ISession), expired: true };
    } else if (error instanceof JWSInvalid) console.log({ errrrrrrrrrrrrr_verifyAccessToken_JWTInvalid: error.code });
    else console.log({ error });
    return null;
  }
}

export async function verifyRefreshToken(token: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<ISession>(token, REFRESH_TOKEN_SECRET_KEY, {
      algorithms: ["HS256"],
    });

    return { ...payload, expired: false };
  } catch (error) {
    if (error instanceof JWSSignatureVerificationFailed) {
      console.log("verifyRefreshToken --- > JWSSignatureVerificationFailed");
      return null;
    }

    if (error instanceof JWTExpired) {
      console.log({ errrrrrrrrrrrrr_verifyRefreshToken: error.code });
      return { ...(error.payload as unknown as ISession), expired: true };
    }

    return null;
  }
}
