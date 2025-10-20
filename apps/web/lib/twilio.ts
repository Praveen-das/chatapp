"use server";

// @ts-ignore
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID2;
const authToken = process.env.TWILIO_AUTH_TOKEN2;

const twilioClient = twilio(accountSid, authToken);

async function sendOtp(phonenumber: string) {
    console.log(phonenumber)
  const verification = await twilioClient.verify.v2
    .services("VA319329072a5475032d5811b562d881dd")
    .verifications.create({
      channel: "sms",
      to: phonenumber,
    });
  return verification;
}

async function verifyOtp(phonenumber: string) {
  const verification = await twilioClient.verify.v2
    .services("VA319329072a5475032d5811b562d881dd")
    .verifications.create({
      channel: "sms",
      to: phonenumber,
    });
  return verification;
}

export { sendOtp, verifyOtp };
