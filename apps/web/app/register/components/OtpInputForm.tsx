"use client";
import { EditPencil } from "iconoir-react";
import { useEffect, useState } from "react";
import OtpInput from "react-otp-input";

import "react-phone-input-2/lib/style.css";
import "./inputStyle.css";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { AxiosError } from "axios";
import RenderErrorMessage from "./RenderErrorMessage";
import { useRegistrationForm } from "context/RegistrationFormContext";

export default function OtpInputForm() {
  const { phonenumber, setForm, requestOTP } = useRegistrationForm();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState<string>();
  const [otpError, setOtpError] = useState<string>("");
  const router = useRouter();

  async function handleOTPVerification() {
    try {
      // if (!phonenumber.value) throw Error("phonenumber not provided");
      // if (!otp) throw Error("OTP not provided");
      // if (otp.length < 6) throw Error("Invalid OTP");

      setLoading(true);
      setOtpError("");

      // const body = { phonenumber: "+" + phonenumber.value, code: otp };

      // const verificationCheck = await axiosClient.post("/db/otp/verify", JSON.stringify(body)).then((res) => res.data);

      // if (verificationCheck.error) {
      //   switch (verificationCheck.error.code) {
      //     case 20404:
      //       throw Error("OTP Expired");
      //     default:
      //       throw Error("Unknown error occurred try again later");
      //   }
      // }

      // if (verificationCheck.status === "pending") throw Error("Invalid OTP");

      // if (verificationCheck.status === "approved") {
      // }

      const res = await signIn("credentials", {
        phoneNumber: phonenumber.value,
        type: "signin",
        redirect: false,
      });

      if (res?.ok) return router.replace("/");
      else if (res?.error === "UNREGISTERED_USER") setForm("profile_info");
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) return setOtpError(error.response?.data.error || error.response?.statusText);
      if (error instanceof Error) return setOtpError(error.message);
      setLoading(false);
    } finally {
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
            <input {...props} className="!border-[1px] !border-[--avatarBg] rounded-xl !bg-transparent" />
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

      <ResendOtp onResend={handleOTPVerification} />
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
