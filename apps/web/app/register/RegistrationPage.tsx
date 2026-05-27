"use client";
import { useRegistrationForm } from "context/RegistrationFormContext";
import "react-phone-input-2/lib/style.css";
import { PhoneNumberInputForm } from "./components/PhoneNumberInputForm";
import OtpInputForm from "./components/OtpInputForm";
import RecoveryKeyForm from "./components/RecoveryKeyForm";
import ProfileCreationForm from "./components/ProfileCreationForm";
import { useE2eeStore } from "store/e2eStore";

export default function RegistrationPage() {
  const { form } = useRegistrationForm();
  const needsRestore = useE2eeStore((s) => s.needsRestore);

  // Authenticated user with missing local E2EE keys — force recovery
  if (needsRestore) return <RecoveryKeyForm />;

  if (form === "phone_number") return <PhoneNumberInputForm />;
  if (form === "otp") return <OtpInputForm />;
  if (form === "recovery_key") return <RecoveryKeyForm />;
  if (form === "profile_info") return <ProfileCreationForm />;

  return null;
}
