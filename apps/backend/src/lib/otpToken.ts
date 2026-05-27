import { SignJWT, jwtVerify } from "jose";
import { JWTExpired } from "jose/errors";

const OTP_TOKEN_SECRET = new TextEncoder().encode(process.env.JWT_USER_TOKEN_SECRET_KEY);

/**
 * Creates a short-lived JWT proving a phone number was OTP-verified.
 * Valid for 10 minutes — enough time to fill the profile form.
 */
export async function createOtpToken(phonenumber: string): Promise<string> {
  return new SignJWT({ phonenumber, purpose: "otp-verified" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10min")
    .sign(OTP_TOKEN_SECRET);
}

/**
 * Verifies the OTP token and returns the phone number it was issued for.
 * Returns null if the token is invalid or expired.
 */
export async function verifyOtpToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, OTP_TOKEN_SECRET, {
      algorithms: ["HS256"],
    });

    if (payload.purpose !== "otp-verified" || typeof payload.phonenumber !== "string") {
      return null;
    }

    return payload.phonenumber;
  } catch (error) {
    if (error instanceof JWTExpired) {
      console.error("OTP token expired");
    }
    return null;
  }
}
