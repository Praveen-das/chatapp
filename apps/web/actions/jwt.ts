"use server";

import { ISession } from "@interfaces/sessionInterface";
import { SignJWT, jwtVerify } from "jose";
import { JWSInvalid, JWSSignatureVerificationFailed, JWTExpired, JWTInvalid } from "jose/errors";

const REFRESH_TOKEN_SECRET_KEY = new TextEncoder().encode(process.env.JWT_REFRESH_TOKEN_SECRET_KEY);
const ACCESS_TOKEN_SECRET_KEY = new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN_SECRET_KEY);

export async function sign(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20sec")
    .sign(ACCESS_TOKEN_SECRET_KEY);
}

export async function createRefreshToken(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(REFRESH_TOKEN_SECRET_KEY);
}

export async function createAccessToken(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5min")
    .sign(ACCESS_TOKEN_SECRET_KEY);
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify<ISession>(token, ACCESS_TOKEN_SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return { ...payload, expired: false };
  } catch (error) {
    if (error instanceof JWSSignatureVerificationFailed) {
      console.log("JWSSignatureVerificationFailed");
      return null;
    }

    if (error instanceof JWTExpired) {
      error.payload;
      console.log({ errrrrrrrrrrrrr_verifyAccessToken_JWTExpired: error.code });
      return { ...(error.payload as unknown as ISession), expired: true };
    }

    if(error instanceof JWSInvalid){
      console.log({errrrrrrrrrrrrr_verifyAccessToken_JWTInvalid: error.code })
      return null;
    }

    console.log({error})
    return null;
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify<ISession>(token, REFRESH_TOKEN_SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return { ...payload, expired: false };
  } catch (error) {
    if (error instanceof JWSSignatureVerificationFailed) {
      console.log("JWSSignatureVerificationFailed");
      return null;
    }

    if (error instanceof JWTExpired) {
      error.payload;
      console.log({ errrrrrrrrrrrrr_verifyRefreshToken: error.code });
      return { ...(error.payload as unknown as ISession), expired: true };
    }

    return null;
  }
}
