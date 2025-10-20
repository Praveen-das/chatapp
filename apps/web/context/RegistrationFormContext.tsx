"use client";
import axiosClient from "@lib/axiosClient";
import { IPhoneNUmber, ITabs } from "app/register/components/types";
import { AxiosError } from "axios";
import { isProduction } from "config/constants";
import { CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { useRouter } from "next/navigation";
import React, { createContext, PropsWithChildren, useCallback, useContext, useState } from "react";

const initialPhoneNumber = {
  value: !isProduction ? process.env.NEXT_PUBLIC_TEST_PNONENUMBER! : "",
  fomattedValue: "",
  data: null,
  error: "",
};

const useContextData = () => {
  const [form, setForm] = useState<ITabs>("phone_number");
  const [phonenumber, setPhonenumber] = useState<IPhoneNUmber>(initialPhoneNumber);
  const router = useRouter();

  const requestOTP = useCallback(async () => {
    // if (!phonenumber) return;
    // if (!phonenumber.data) return;

    // const withCountryCode = phonenumber.value;
    // const data = phonenumber.data;

    // if (!data) return;

    // const withoutCountryCode = withCountryCode.slice(data.dialCode.length);
    // const countryCode = data.countryCode.toUpperCase() as CountryCode;

    try {
      // const isValid = isValidPhoneNumber(withoutCountryCode, countryCode);

      // if (!isValid) throw Error("Invalid phone number");
      // if (phonenumber.error) setPhonenumber((prev) => ({ ...prev, error: "" }));

      // const body = { phonenumber: "+" + phonenumber.value };
      // const verification = await axiosClient.post("/db/otp/send", body).then((res) => res.data);

      // if (verification.error) {
      //   console.log(verification.error);
      //   setPhonenumber((prev) => ({ ...prev, error: verification.error.message }));
      //   return;
      // }

      // if (verification.status === "pending") {
      //   setForm("otp");
      // }

      setForm("otp");
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError)
        return setPhonenumber((prev) => ({ ...prev, error: error.response?.data.error || error.response?.statusText }));
      if (error instanceof Error) return setPhonenumber((prev) => ({ ...prev, error: error.message }));
    }
  }, [phonenumber]);

  return {
    form,
    setForm,
    requestOTP,
    phonenumber,
    setPhonenumber,
  };
};

const Context = createContext<ReturnType<typeof useContextData> | null>(null);

export function RegistrationFormContext({ children }: PropsWithChildren) {
  const value = useContextData();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useRegistrationForm = () => {
  const c = useContext(Context);
  if (!c) throw Error("context not found");
  return c;
};
