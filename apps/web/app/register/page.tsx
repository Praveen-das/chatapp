import { RegistrationFormContext } from "context/RegistrationFormContext";
import RegistrationPage from "./RegistrationPage";

export default function () {
  return (
    <RegistrationFormContext>
      <RegistrationPage />
    </RegistrationFormContext>
  );
}
