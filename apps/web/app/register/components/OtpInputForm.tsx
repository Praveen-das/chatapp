"use client";
import { EditPencil } from "iconoir-react";
import { useEffect, useState } from "react";
import OtpInput from "react-otp-input";

import "react-phone-input-2/lib/style.css";
import "./inputStyle.css";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { AxiosError } from "axios";
import RenderErrorMessage from "./RenderErrorMessage";
import { useRegistrationForm } from "context/RegistrationFormContext";
import axiosClient from "@lib/axiosClient";

export default function OtpInputForm() {
  const { phonenumber, setForm, requestOTP, setOtpToken, setVerifiedUser } = useRegistrationForm();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState<string>();
  const [otpError, setOtpError] = useState<string>("");
  const router = useRouter();

  async function handleOTPVerification() {
    let shouldKeepLoading = false;
    try {
      if (!phonenumber.value) throw Error("phonenumber not provided");
      if (!otp) throw Error("OTP not provided");
      if (otp.length < 6) throw Error("Invalid OTP");

      setLoading(true);
      setOtpError("");

      const body = { phonenumber: "+" + phonenumber.value, code: otp };

      const verificationCheck = await axiosClient.post("/db/otp/verify", body).then((res) => res.data);

      if (verificationCheck.status === "pending") throw Error("Invalid OTP");

      if (verificationCheck.status === "approved") {
        // Store the OTP token for the signup flow
        if (verificationCheck.otpToken) {
          setOtpToken(verificationCheck.otpToken);
        }

        const res = await signIn("credentials", {
          phoneNumber: phonenumber.value,
          type: "signin",
          redirect: false,
        });

        if (res?.ok) {
          // Skip recovery if local keys already exist
          const localPub = localStorage.getItem("e2e_public_key");
          const localPriv = localStorage.getItem("e2e_private_key");

          if (localPub && localPriv) {
            shouldKeepLoading = true;
            return router.replace("/");
          }

          // No local keys — check if the user has a recovery key backup
          const session = await getSession();
          const user = session?.user;

          if (user?.encryptedPrivateKey && user?.publicKey) {
            setVerifiedUser(user);
            shouldKeepLoading = true;
            return router.replace("/recover");
          }

          shouldKeepLoading = true;
          return router.replace("/");
        } else if (res?.error === "UNREGISTERED_USER") setForm("profile_info");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        const msg = error.response?.data?.error?.message ?? error.response?.statusText;
        setOtpError(msg || "Verification failed");
      } else if (error instanceof Error) {
        setOtpError(error.message);
      } else {
        setOtpError("An unknown error occurred");
      }
    } finally {
      if (!shouldKeepLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => () => setLoading(false), []);

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div layout className="w-full flex flex-col items-center gap-8">
        <h1 className="relative text-4xl font-bold whitespace-nowrap">
          {phonenumber?.fomattedValue || "0000000000"}
          <div className="absolute right-0 bottom-0 translate-x-full ">
            <div onClick={() => setForm("phone_number")} tabIndex={0} className="btn btn-circle btn-sm btn-ghost">
              <EditPencil width={20} height={20} />
            </div>
          </div>
        </h1>

        <p className="text-center w-full mb-4">Check your phone for the verification code</p>

        <OtpInput
          containerStyle={{ gap: "8px" }}
          inputStyle={{ width: "40px", height: "40px", fontSize: "16px" }}
          value={otp}
          inputType="number"
          onChange={(e) => {
            setOtpError("");
            setOtp(e);
          }}
          numInputs={6}
          renderSeparator={<span>-</span>}
          renderInput={(props) => (
            <input {...props} className="!border !border-[--avatarBg] rounded-xl !bg-transparent" />
          )}
        />
      </motion.div>

      <RenderErrorMessage errorMessage={otpError} />

      <motion.div layout className="mt-12 w-full">
        <button
          disabled={loading}
          onClick={handleOTPVerification}
          className="btn btn-block btn-primary text-[--black-white] mt-6"
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </motion.div>

      <ResendOtp onResend={requestOTP} />
    </div>
  );
}

const RESEND_SECONDS = 30;

type ResendOtpProps = {
  onResend: () => Promise<void> | void;
};

function ResendOtp({ onResend }: ResendOtpProps) {
  const [timeLeft, setTimeLeft] = useState<number>(RESEND_SECONDS);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  useEffect(() => {
    setTimeLeft(RESEND_SECONDS);
  }, []);

  async function handleResendClick() {
    if (sending || timeLeft > 0) return;
    try {
      setSending(true);
      await onResend();
      setTimeLeft(RESEND_SECONDS);
    } finally {
      setSending(false);
    }
  }

  const padded = String(timeLeft).padStart(2, "0");

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleResendClick}
        disabled={sending || timeLeft > 0}
        className="btn btn-ghost btn-sm btn-link no-underline !bg-transparent"
      >
        {sending ? "Sending..." : timeLeft > 0 ? `Resend OTP in 00:${padded} Sec` : "Resend OTP"}
      </button>
    </div>
  );
}
