import { z } from "zod";

/** E.164 format: +{countryCode}{number}, 7-15 digits total */
const e164Phone = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone number must be in E.164 format (e.g. +14155552671)");

export const sendOtpSchema = z.object({
  phonenumber: e164Phone,
});

export const verifyOtpSchema = z.object({
  phonenumber: e164Phone,
  code: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});
