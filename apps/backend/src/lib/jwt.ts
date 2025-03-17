import { jwtVerify } from "jose";

const USER_TOKEN_SECRET_KEY = new TextEncoder().encode(process.env.JWT_USER_TOKEN_SECRET_KEY);
const ACCESS_TOKEN_SECRET_KEY = new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN_SECRET_KEY);

export async function verifyUserToken(token: any) {
  try {
    const { payload } = await jwtVerify(token, USER_TOKEN_SECRET_KEY, {
      algorithms: ["HS256"],
    });
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

export async function verifyAccessToken(token: any) {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error: any) {
    if (error.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
      console.log("verifyAccessToken --> JWSSignatureVerificationFailed");
      return null;
    } else {
      console.log("verifyAccessToken other error----->", error.code);
    }
    return null;
  }
}
