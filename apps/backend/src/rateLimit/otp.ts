import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";
import { isProduction } from "../../const";

export const otpRateLimiter = rateLimit({
  windowMs: isProduction
    ? 24 * 60 * 60 * 1000 // 24 hours
    : 30 * 1000, // 30 seconds
  max: isProduction ? 3 : 5, // limit each phone number/IP to 5 OTP requests per windowMs
  message: {
    success: false,
    error: "Too many OTP requests. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
});
