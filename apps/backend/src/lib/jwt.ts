import { SignJWT, jwtVerify } from "jose";

const key = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function sign(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(key);
}

export async function verify(token: any) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error: any) {
    if (error.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
      console.log("JWSSignatureVerificationFailed");
      return null;
    } else {
      console.log(error);
    }
    return null;
  }
}
