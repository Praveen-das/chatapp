import { Router } from "express";

import twilio from "twilio";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SERVICE_SID = process.env.TWILIO_SERVICE_SID;

const twilioClient = twilio(ACCOUNT_SID, AUTH_TOKEN);

const router = Router();

router.post("/send", async (req, res) => {
  const { phonenumber } = req.body;
  try {
    const verification = await twilioClient.verify.v2
      .services(SERVICE_SID!)
      .verifications.create({ channel: "sms", to: phonenumber });

    return res.json(verification);
  } catch (error) {
    console.log(error);
    return res.json({error});
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { phonenumber, code } = req.body;
    
    const verificationCheck = await twilioClient.verify.v2
      .services(SERVICE_SID!)
      .verificationChecks.create({ code, to: phonenumber });
      
      return res.json(verificationCheck);
    } catch (error) {
      console.log(error)
      return res.json({error});
  }
});

export default router;
