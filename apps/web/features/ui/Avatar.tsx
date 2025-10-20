"use client";
import { CameraIcon, UserIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { ChangeEvent, MouseEvent, memo, useRef } from "react";
import { useStore } from "store/global";
import { CustomImage } from "./CustomImage";

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
      onClick={!enableOptions && !url ? onClick : undefined}
      className={`self-center flex justify-center items-center relative ${profilePicture ? "" : "bg-[--avatarBg]"} text-white rounded-full`}
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
        <CustomImage
          className="w-full h-full rounded-full"
          width={100}
          height={100}
          href={url}
          placeHolder={url + "?tr=w-1"}
          alt="profile picture"
        />
      ) : (
        <UserIcon className="size-2/4 duration-200" />
      )}

      {enableOptions && (
        <div
          onClick={url && onClick ? onClick : handleInput}
          className="hover:opacity-100 opacity-0 duration-200 absolute flex flex-col gap-2 z-10 justify-center items-center text-xs p-2 text-center w-full h-full bg-black/50 backdrop-blur-md rounded-full cursor-pointer"
        >
          <input
            id={id}
            onInput={handleInputChange}
            ref={inputRef}
            type="file"
            hidden
            accept="image/png, image/gif, image/jpeg"
          />
          <label className="pointer-events-none" htmlFor="Change profile picture">
            {url ? (
              <div className="flex justify-center items-center flex-col gap-1">
                <CameraIcon className="size-7" />
                <span>Change profile picture</span>
              </div>
            ) : (
              <div className="flex justify-center items-center flex-col gap-1">
                <CameraIcon className="size-7" />
                <span>Add profile picture</span>
              </div>
            )}
          </label>
        </div>
      )}

      {onlineIndication && (
        <span className={`absolute top-0 right-0 w-3 h-3 ${online ? "bg-green-400" : "bg-gray-400"} rounded-full`} />
      )}
    </div>
  );
}

export default memo(Avatar);
