"use client";
import Menu from "@components/ui/Menu";
import { CameraIcon, UserIcon } from "@heroicons/react/24/solid";
import useAuth from "@hooks/useAuth";
import Image from "next/image";
import React, {
  ChangeEvent,
  ChangeEventHandler,
  MouseEvent,
  memo,
  useMemo,
  useRef,
  useState,
} from "react";
import { useStore } from "store/global";

interface IAvatar {
  online?: boolean;
  onlineIndication?: boolean;
  size?: string;
  profileHidden?: boolean;
  canChangeAvatar?: boolean;
  url?: string;
  onChange?: (file: File) => void;
  onDelete?: () => void;
  onPreview?: () => void;
  onClick?: () => void;
  menu?: boolean;
  loading?: boolean;
}

function Avatar({
  online = false,
  onlineIndication = true,
  size = "40px",
  profileHidden = false,
  canChangeAvatar = false,
  onChange,
  onDelete,
  onPreview,
  onClick,
  url,
  menu = false,
  loading = false,
}: IAvatar) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdown, setDropdown] = useState({ visible: false, x: 0, y: 0 });

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onChange?.(file);
    handleClose();
  }

  function handleInput() {
    inputRef.current?.click();
  }

  const handleDropdown = (event: MouseEvent<HTMLDivElement>) => {
    const x = event.clientX;
    const y = event.clientY;

    setDropdown({ visible: true, x, y });
  };

  const handleClose = () => setDropdown({ ...dropdown, visible: false });

  const options = useMemo(() => {
    return [
      {
        label: "View image",
        handler: () => {
          onPreview?.();
          handleClose();
        },
      },
      {
        label: "Change image",
        handler: () => {
          handleInput();
          handleClose();
        },
      },
      {
        label: "Delete image",
        handler: () => {
          onDelete?.();
          handleClose();
        },
      },
    ];
  }, []);

  const profilePicture = url && !profileHidden;

  return (
    <div
      onClick={onClick}
      className={`self-center flex justify-center items-center relative ${profilePicture ? "" : "bg-gray-500"} rounded-full`}
      style={{
        minWidth: size,
        width: size,
        height: size,
        // boxShadow:'0 0 3px black'
      }}
    >
      {loading && (
        <span className="absolute inset-0 m-auto flex items-center justify-center bg-black/30 rounded-full">
          <span className="loading loading-spinner loading-lg"></span>
        </span>
      )}
      {profilePicture && !profileHidden ? (
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
      {dropdown.visible && (
        <>
          <div onClick={handleClose} className="fixed inset-0 z-20" />
          <Menu
            style={{ position: "absolute" }}
            refElm={{ x: dropdown.x, y: dropdown.y }}
            menuItems={options}
            placement={"bottom-start"}
            static
          />
        </>
      )}
      {canChangeAvatar && (
        <div
          onClick={menu ? handleDropdown : handleInput}
          className="hover:opacity-100 opacity-0 duration-200 absolute flex flex-col gap-2 z-10 justify-center items-center text-xs p-2 text-center w-full h-full bg-black/50 rounded-full cursor-pointer"
        >
          <input
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

export default memo(Avatar)
