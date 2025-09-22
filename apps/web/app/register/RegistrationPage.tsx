"use client";
import Avatar from "@features/ui/Avatar";
import { Input } from "@features/ui/Input";
import { EditPencil } from "iconoir-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import OtpInput from "react-otp-input";

import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./inputStyle.css";
import { CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { uploadImage } from "@lib/imageKit";
import ObjectID from "bson-objectid";

type IPhoneNUmber = {
  value: string;
  fomattedValue: string;
  data: CountryData | null;
  error?: string;
};

const initialPhoneNumber = {
  value: "918848990353",
  fomattedValue: "",
  data: null,
  error: "",
};

type ITabs = "phone_number" | "otp" | "profile_info";

export default function RegistrationPage() {
  const [tab, setTab] = useState<ITabs>("phone_number");
  const [phonenumber, setPhonenumber] = useState<IPhoneNUmber>(initialPhoneNumber);

  if (tab === "phone_number")
    return <PhoneNumberInputForm phonenumber={phonenumber} setTab={setTab} setPhonenumber={setPhonenumber} />;
  if (tab === "otp") return <OtpInputForm setTab={setTab} phonenumber={phonenumber} />;
  return <ProfileInfoForm phonenumber={phonenumber} />;
}

type IPhoneNumberInputForm = {
  phonenumber: IPhoneNUmber;
  setPhonenumber: Dispatch<SetStateAction<IPhoneNUmber>>;
  setTab: Dispatch<SetStateAction<ITabs>>;
};

function PhoneNumberInputForm({ phonenumber, setTab, setPhonenumber }: IPhoneNumberInputForm) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submitPhoneNumber() {
    if (!phonenumber) return;
    if (!phonenumber.data) return;

    setLoading(true);

    const withCountryCode = phonenumber.value;
    const data = phonenumber.data;

    if (!data) return;

    const withoutCountryCode = withCountryCode.slice(data.dialCode.length);
    const countryCode = data.countryCode.toUpperCase() as CountryCode;

    try {
      const isValid = isValidPhoneNumber(withoutCountryCode, countryCode);

      if (!isValid) throw Error("Invalid phone number");

      // const body = { phonenumber: "+" + phonenumber.value };
      // const verification = await axiosClient.post("/db/otp/send", JSON.stringify(body)).then((res) => res.data);

      // if (verification.error) {
      //   console.log(verification.error);
      //   return;
      // }

      // if (verification.status === "pending") {
      //   setTab("otp");
      // }

      setTab("otp");
    } catch (error) {
      if (error instanceof Error) setPhonenumber((prev) => ({ ...prev, error: error.message }));
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function mockSignup() {
    if (!process.env.NEXT_PUBLIC_CLIENT_ONLY) return;

    const res = await signIn("credentials", {
      type: "mock-signin",
      redirect: false,
    });

    if (res?.ok) return router.replace("/");
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div layout className="w-full flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold">Phone number</h1>
        <p className="text-center w-full mb-4">Please enter your phone number</p>
        <PhoneInput
          inputClass="!h-12 !pl-14 !text-lg !bg-base-300 !rounded-xl "
          dropdownClass="!bg-base-200 [&>.highlight]:!bg-base-100 [&>.country:hover]:!bg-base-100"
          buttonClass="!bg-transparent [&>.selected-flag:hover]:!bg-transparent [&>.open]:!bg-transparent !border-none"
          country={"in"}
          value={phonenumber?.value}
          onChange={(value, data: CountryData, _, fomattedValue) => setPhonenumber({ value, data, fomattedValue })}
        />
      </motion.div>

      <RenderErrorMessage errorMessage={phonenumber.error} />

      <motion.div layout className="w-full mt-10">
        {process.env.NEXT_PUBLIC_CLIENT_ONLY && (
          <span onClick={mockSignup} className="btn btn-block btn-link">
            mock
          </span>
        )}
        <button
          id="sign-in-button"
          disabled={!phonenumber || loading}
          onClick={submitPhoneNumber}
          className="btn btn-block btn-primary text-[--black-white] mt-6"
        >
          Submit
        </button>
      </motion.div>
    </div>
  );
}

type IOtpInputForm = {
  phonenumber: IPhoneNUmber;
  setTab: Dispatch<SetStateAction<ITabs>>;
};

function OtpInputForm({ phonenumber, setTab }: IOtpInputForm) {
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
      else if (res?.error === "UNREGISTERED_USER") setTab("profile_info");
    } catch (error) {
      console.log(error);
      if (error instanceof Error) setOtpError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div layout className="w-full flex flex-col items-center gap-8">
        <h1 className="relative text-4xl font-bold whitespace-nowrap">
          {phonenumber?.fomattedValue || "0000000000"}
          <div className="absolute right-0 bottom-0 translate-x-full ">
            <div onClick={() => setTab("phone_number")} tabIndex={0} className="btn btn-circle btn-sm btn-ghost">
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
    </div>
  );
}

type IProfileInfoForm = {
  phonenumber: IPhoneNUmber;
};

function ProfileInfoForm({ phonenumber }: IProfileInfoForm) {
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreatingUser() {
    try {
      setLoading(true);

      const user = {
        id: new ObjectID().toHexString(),
        phoneNumber: phonenumber.value,
        username,
        profilePicture,
        type: "signup",
        redirect: false,
      };

      if (profilePicture) {
        const res = await uploadImage(profilePicture, user.id, true);
        user.profilePicture = res.url;
      }

      const res = await signIn("credentials", user);
      if (res?.ok) return router.replace("/");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // useEffect(() => {
  //   navigator.geolocation.getCurrentPosition(async (position) => {
  //     const { latitude, longitude } = position.coords;
  //     const response = await fetch(
  //       `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
  //     );
  //     const data = await response.json();
  //     console.log(data.countryCode); // Example: "US"
  //   });
  // }, []);

  return (
    <div className="flex flex-col items-center gap-8 max-w-xs">
      <h1 className="text-4xl font-bold">Profile info</h1>
      <p className="text-center w-full mb-4">Please provide your name and an optional profile photo</p>
      <div className="w-full flex flex-col items-center gap-6">
        <div className="flex justify-center mb-4">
          <Avatar
            url={profilePicture}
            onChange={setProfilePicture}
            enableOptions
            size="160px"
            onlineIndication={false}
          />
        </div>
        <Input value={username} onChange={setUsername} />
        <button
          disabled={loading}
          onClick={handleCreatingUser}
          className="btn btn-block btn-primary text-[--black-white] mt-6"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

const motionError = {
  initial: { opacity: 0, y: -5 },
  exit: { opacity: 0, y: -5 },
  animate: { opacity: 1, y: 0 },
};

function RenderErrorMessage({ errorMessage }: { errorMessage?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      {errorMessage && (
        <motion.div {...motionError} className="text-sm text-error whitespace-nowrap">
          {errorMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
