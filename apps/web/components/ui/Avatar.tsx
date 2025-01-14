"use client";
import { CameraIcon, UserIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { ChangeEvent, MouseEvent, memo, useRef } from "react";
import { useStore } from "store/global";

interface IAvatar {
  id?: string;
  online?: boolean;
  onlineIndication?: boolean;
  size?: string;
  profileHidden?: boolean;
  loading?: boolean;
  url?: string;
  enableOptions?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onChange?: (base64: string) => void;
}

function Avatar({
  id,
  online = false,
  onlineIndication = true,
  size = "40px",
  profileHidden = false,
  onClick,
  onChange,
  enableOptions,
  url,
  loading,
}: IAvatar) {
  const setModal = useStore((s) => s.setModal);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    openUploadProfilePictureModal(file);
  }

  function handleInput() {
    inputRef.current?.click();
  }

  const profilePicture = url && !profileHidden;

  function openUploadProfilePictureModal(file: File) {
    setModal({
      activeModal: "uploadProfilePictureModal",
      state: { file, callback: onChange },
      open: true,
    });
  }

  return (
    <div
      onClick={!enableOptions ? onClick : undefined}
      className={`self-center flex justify-center items-center relative ${profilePicture ? "" : "bg-gray-500"} rounded-full`}
      style={{
        minWidth: size,
        minHeight: size,
        width: size,
        height: size,
      }}
    >
      {loading && (
        <span className="absolute inset-0 m-auto flex items-center justify-center bg-black/30 rounded-full">
          <span className="loading loading-spinner loading-lg"></span>
        </span>
      )}
      {profilePicture ? (
        <Image
          className="w-full h-full rounded-full"
          width={100}
          height={100}
          src={url}
          alt="profile picture"
        />
      ) : (
        <UserIcon className="size-2/4" />
      )}

      {enableOptions && (
        <div
          onClick={url ? onClick : handleInput}
          className="hover:opacity-100 opacity-0 duration-200 absolute flex flex-col gap-2 z-10 justify-center items-center text-xs p-2 text-center w-full h-full bg-black/50 rounded-full cursor-pointer"
        >
          <input
            id={id}
            onInput={handleInputChange}
            ref={inputRef}
            type="file"
            hidden
            accept="image/png, image/gif, image/jpeg"
          />
          <CameraIcon className="size-6" />
          <label
            className="pointer-events-none"
            htmlFor="Change profile picture"
          >
            {url ? "Change profile picture" : "Upload profile picture"}
          </label>
        </div>
      )}

      {onlineIndication && (
        <span
          className={`absolute top-0 right-0 w-3 h-3 ${online ? "bg-green-400" : "bg-gray-400"} rounded-full`}
        />
      )}
    </div>
  );
}

export default memo(Avatar);
