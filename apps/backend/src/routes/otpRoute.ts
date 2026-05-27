import { Router, Request, Response } from "express";
import twilio from "twilio";
import { sendOtpSchema, verifyOtpSchema } from "../schemas/otpSchema";
import { createOtpToken } from "../lib/otpToken";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SERVICE_SID = process.env.TWILIO_SERVICE_SID;

if (!ACCOUNT_SID || !AUTH_TOKEN || !SERVICE_SID) {
  throw new Error(
    "Missing required Twilio env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SERVICE_SID"
  );
}

const twilioClient = twilio(ACCOUNT_SID, AUTH_TOKEN);

const router = Router();

router.post("/send", async (req: Request, res: Response) => {
  const parsed = sendOtpSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: {
        message: parsed.error.errors[0]?.message ?? "Invalid request body",
      },
    });
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(SERVICE_SID)
      .verifications.create({ channel: "sms", to: parsed.data.phonenumber });

    return res.json({ status: verification.status });
  } catch (error: any) {
    console.error("Twilio send error:", error.message);
    return res.status(error.status ?? 500).json({
      error: {
        message: error.message || "Failed to send verification code",
        code: error.code,
      },
    });
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  const parsed = verifyOtpSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: {
        message: parsed.error.errors[0]?.message ?? "Invalid request body",
      },
    });
  }

  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(SERVICE_SID)
      .verificationChecks.create({
        code: parsed.data.code,
        to: parsed.data.phonenumber,
      });

    if (verificationCheck.status === "approved") {
      const otpToken = await createOtpToken(parsed.data.phonenumber);
      return res.json({
        status: verificationCheck.status,
        valid: verificationCheck.valid,
        otpToken,
      });
    }

    return res.json({
      status: verificationCheck.status,
      valid: verificationCheck.valid,
    });
  } catch (error: any) {
    console.error("Twilio verify error:", error.message);
    return res.status(error.status ?? 500).json({
      error: {
        message: error.message || "Failed to verify code",
        code: error.code,
      },
    });
  }
});

export default router;

