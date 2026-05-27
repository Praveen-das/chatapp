import { CountryData } from "react-phone-input-2";

type IPhoneNUmber = {
  value: string;
  fomattedValue: string;
  data: CountryData | null;
  error?: string;
};

type ITabs = "phone_number" | "otp" | "recovery_key" | "profile_info";
