"use client";
import Avatar from "@features/ui/Avatar";
import { Input } from "@features/ui/Input";
import { useState } from "react";
import { uploadImage } from "@lib/imageKit";
import ObjectID from "bson-objectid";
import { useRegistrationForm } from "context/RegistrationFormContext";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import "react-phone-input-2/lib/style.css";
import "./inputStyle.css";
import RenderErrorMessage from "./RenderErrorMessage";

export default function ProfileCreationForm() {
  const { phonenumber } = useRegistrationForm();
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
     
      if(res?.error) return setError(res.error)
      if (res?.ok) return router.replace("/");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  function handleInput(value:string){
    setError('')
    setUsername(value)
  }

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
        <Input value={username} onChange={handleInput} />
        <RenderErrorMessage errorMessage={error} />
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
