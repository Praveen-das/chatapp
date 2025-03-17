"use client";
import Avatar from "@features/ui/Avatar";
import { Input } from "@features/ui/Input";
import { EditPencil } from "iconoir-react";
import { useState } from "react";
import OtpInput from "react-otp-input";

import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./inputStyle.css";
import { CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { createUser } from "@actions/auth";
import { useRouter } from "next/navigation";
import { saveSession } from "@actions/session";
import { verifyOtpAndGetUser } from "@actions/otp";

type IPhoneNUmber = {
  value: string;
  fomattedValue: string;
  data: CountryData | null;
  error?: boolean;
};

const initialPhoneNumber = {
  value: "918848990353",
  fomattedValue: "",
  data: null,
  error: false,
};

export default function RegistrationPage() {
  const [tab, setTab] = useState<"phone_number" | "otp" | "profile_info">(
    "phone_number"
  );
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [phonenumber, setPhonenumber] =
    useState<IPhoneNUmber>(initialPhoneNumber);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState<string>();
  const router = useRouter();

  function submitPhoneNumber() {
    if (!phonenumber) return;
    const withCountryCode = phonenumber.value;
    const data = phonenumber.data;

    if (!data) return;

    const withoutCountryCode = withCountryCode.slice(data.dialCode.length);
    const countryCode = data.countryCode.toUpperCase() as CountryCode;

    const isValid = isValidPhoneNumber(withoutCountryCode, countryCode);

    if (isValid) setTab("otp");
    else setPhonenumber((s) => ({ ...s, error: true }));
  }

  async function handleOTPVerification() {
    setLoading(true);
    // if verification is successful

    if (!phonenumber.value) throw "phonenumber not provided";

    console.log({phonenumber:phonenumber.value})

    const res = await verifyOtpAndGetUser(phonenumber.value);
    
    if (res) {
      return router.replace("/");
    } else {
      setTab("profile_info");
    }
    setLoading(false);
  }

  async function handleCreatingUser() {
    setLoading(true);

    const req = {
      username,
      phoneNumber: phonenumber.value,
      profilePicture,
    };

    const newUser = await createUser(req)!;

    if (newUser) await saveSession(newUser);

    setLoading(false);
    router.replace("/");
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

  if (tab === "phone_number")
    return (
      <div className="flex flex-col items-center gap-16 max-w-xs">
        <h1 className="text-4xl font-bold">Phone number</h1>
        <div className="flex flex-col gap-8">
          <p className="text-center">Please enter your phone number</p>
          <div className="relative w-full">
            {phonenumber?.error && (
              <span className="absolute px-1 top-0 left-4 -translate-y-1/2 bg-base-300 z-10 text-xs text-error">
                Invalid phone number
              </span>
            )}
            <PhoneInput
              inputClass="!h-12 !pl-14 !text-lg !bg-base-300 !rounded-xl "
              dropdownClass="!bg-base-200 [&>.highlight]:!bg-base-100 [&>.country:hover]:!bg-base-100"
              buttonClass="!bg-transparent [&>.selected-flag:hover]:!bg-transparent [&>.open]:!bg-transparent !border-none"
              country={"in"}
              value={phonenumber?.value}
              onChange={(value, data: CountryData, _, fomattedValue) =>
                setPhonenumber({ value, data, fomattedValue })
              }
            />
          </div>
          <button
            disabled={!phonenumber}
            onClick={submitPhoneNumber}
            className="btn btn-primary mt-6"
          >
            Submit
          </button>
        </div>
      </div>
    );

  if (tab === "otp")
    return (
      <div className="flex flex-col items-center gap-8 max-w-xs">
        <h1 className="relative text-4xl font-bold whitespace-nowrap">
          {phonenumber?.fomattedValue}
          <div className="absolute right-0 bottom-0 translate-x-full ">
            <div
              onClick={() => setTab("phone_number")}
              tabIndex={0}
              className="btn btn-circle btn-sm btn-ghost"
            >
              <EditPencil width={25} height={25} />
            </div>
          </div>
        </h1>
        <div className="flex flex-col items-center gap-8">
          <p className="text-center">
            Check your phone for the verification code
          </p>
          <OtpInput
            containerStyle={{ gap: "8px" }}
            inputStyle={{ width: "40px", height: "40px", fontSize: "16px" }}
            value={otp}
            inputType="number"
            onChange={setOtp}
            numInputs={4}
            renderSeparator={<span>-</span>}
            renderInput={(props) => (
              <input
                {...props}
                className="!border-[1px] !border-base-100 rounded-xl !bg-transparent"
              />
            )}
          />

          <button
            disabled={loading}
            onClick={handleOTPVerification}
            className="btn btn-block btn-primary mt-6"
          >
            {loading ? "Loading..." : "Submit"}
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-8 max-w-xs">
      <h1 className="text-4xl font-bold">Profile info</h1>
      <div className="flex flex-col items-center gap-6">
        <p className="text-center">
          Please provide your name and an optional profile photo
        </p>
        <div className="flex justify-center mt-4">
          <Avatar
            url={profilePicture}
            onChange={setProfilePicture}
            enableOptions
            size="160px"
            onlineIndication={false}
          />
        </div>
        <Input value={username} onChange={setUsername} />
        <div
          onClick={handleCreatingUser}
          className="btn btn-block btn-primary mt-6"
        >
          Submit
        </div>
      </div>
    </div>
  );
}

// export default function(){
//   return <div>Registration Page</div>
// }
