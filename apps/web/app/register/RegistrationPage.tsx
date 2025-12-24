"use client";
import { useRegistrationForm } from "context/RegistrationFormContext";
import "react-phone-input-2/lib/style.css";
import { PhoneNumberInputForm } from "./components/PhoneNumberInputForm";
import OtpInputForm from "./components/OtpInputForm";
import ProfileCreationForm from "./components/ProfileCreationForm";

export default function RegistrationPage() {
  const { form } = useRegistrationForm();

  if (form === "phone_number") return <PhoneNumberInputForm />;
  if (form === "otp") return <OtpInputForm />;
  if (form === "profile_info") return <ProfileCreationForm />;

  return null;
}
