"use client";
import { useRegistrationForm } from "context/RegistrationFormContext";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PhoneInput, { CountryData } from "react-phone-input-2";
import RenderErrorMessage from "./RenderErrorMessage";
import "react-phone-input-2/lib/style.css";
import "./inputStyle.css";

export function PhoneNumberInputForm() {
  const { phonenumber, setPhonenumber, requestOTP } = useRegistrationForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmittingOTP() {
    try {
      setLoading(true);
      await requestOTP();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(true);
    }
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
        <button
          id="sign-in-button"
          disabled={!phonenumber || loading}
          onClick={handleSubmittingOTP}
          className="btn btn-block btn-primary text-[--black-white] mt-6"
        >
          Submit
        </button>
      </motion.div>
    </div>
  );
}
