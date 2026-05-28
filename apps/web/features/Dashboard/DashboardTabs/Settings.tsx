"use client";
import { MouseEvent, useMemo, useState } from "react";
import { useStore } from "../../../store/global";
import useAuth from "../../../hooks/useAuth";
import Avatar from "../../ui/Avatar";
import Menu from "@features/ui/Menu";
import { useMenu } from "store/menu";
import { uploadImage } from "@lib/imageKit";
import TextInput from "../../ui/TextInput";
import Tags from "../../ui/TagInput";
import Header from "./SharedComponents/Header";
import { Cog6ToothIcon, NoSymbolIcon, UserGroupIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { ArrowLeftStartOnRectangleIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useE2eeStore } from "store/e2eStore";

const Settings = () => {
  const { user, updateUser, signOut } = useAuth();

  const setDashboardTab = useStore((s) => s.setDashboardTab);
  const setModal = useStore((s) => s.setModal);
  const setMenu = useMenu((s) => s.setMenu);

  const [loading, setLoading] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  function handleEditUsername(text: string) {
    if (text !== user?.username) {
      updateUser("username", text);
    }
  }

  function handleEditBio(text: string) {
    if (text !== user?.bio) {
      updateUser("bio", text);
    }
  }

  function handleAddingTag(tag: string) {
    updateUser("tags", [tag, ...(user?.tags || [])]);
  }

  function handleRemovingTag(tag: string) {
    updateUser("tags", user?.tags?.filter((tag) => tag !== tag) || []);
  }

  const handleMenu = (menu: string) => {
    setDashboardTab(menu);
  };

  function openViewProfilePictureModal() {
    setModal({
      activeModal: "viewProfilePictureModal",
      state: {
        url: user?.profilePicture,
        displayName: "You",
      },
      open: true,
    });
  }

  const handleDropdown = (e: MouseEvent<HTMLDivElement>) => {
    setMenu({ id: "USER_PROFILE", reference: e, data: null });
  };

  const options = useMemo(() => {
    return [
      {
        label: "View image",
        handler: openViewProfilePictureModal,
      },
      {
        label: "Change image",
        handler: () => document.getElementById("user_avatar")?.click(),
      },
      {
        label: "Delete image",
        handler: handleDeletingProfilePicture,
      },
    ];
  }, []);

  function handleDeletingProfilePicture() {
    updateUser("profilePicture", "");
  }

  function handleUpdatingProfilePicture(base64: string) {
    setLoading(true);

    uploadImage(base64, user?.id!, true).then((res) => {
      updateUser("profilePicture", res.url);
      setLoading(false);
    });
  }

  async function handleLogout() {
    setLogoutLoading(true);
    await signOut();
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" mainTab="dashboard" />
      <div className="flex relative flex-col max-sm:gap-8 gap-10 text-sm w-full h-full py-4  overflow-y-scroll z-50 no-scrollbar">
        <div className="flex justify-center">
          <Menu id="USER_PROFILE" clientPoint>
            {options.map(({ handler, label }) => (
              <Menu.Item key={label} onClick={handler}>
                {label}
              </Menu.Item>
            ))}
          </Menu>

          {/* Avatar */}
          <Avatar
            id="user_avatar"
            size="180px"
            url={user?.profilePicture}
            onlineIndication={false}
            loading={loading}
            onClick={handleDropdown}
            onChange={handleUpdatingProfilePicture}
            enableOptions
          />
        </div>

        <div className="flex flex-col max-sm:gap-8 gap-4 max-sm:px-0 px-4">
          {/* username */}
          <TextInput
            label="Username"
            placeholderText="Add your username"
            text={user?.username!}
            onSubmit={handleEditUsername}
          />

          {/* bio */}
          <TextInput label="About" autoRaw placeholderText="Add your bio" text={user?.bio!} onSubmit={handleEditBio} />

          {/* tags */}
          <Tags tags={user?.tags || []} canEdit onSubmit={handleAddingTag} onDelete={handleRemovingTag} />
        </div>

        <div className="w-full flex flex-col">
          {/* General Settings */}
          <div
            onClick={() => handleMenu("generalSettings")}
            tabIndex={0}
            className="hover:bg-[--hover-secondary] w-full flex gap-4 items-center duration-200 max-sm:px-0 px-4 py-4 rounded-2xl cursor-pointer"
          >
            <Cog6ToothIcon className="size-5" />
            <label htmlFor="notification">General Settings</label>
            <ChevronRightIcon className="size-5 ml-auto" />
          </div>

          {/* Ai Assistant */}
          {/* <div
            onClick={() => handleMenu("aiSettings")}
            tabIndex={0}
            className="hover:bg-[--hover-secondary] w-full flex gap-4 items-center duration-200 max-sm:px-0 px-4 py-4 cursor-pointer"
          >
            <div className="size-5 text-bold">Ai</div>
            <label htmlFor="notification">Ai Assistant</label>
            <ChevronRightIcon className="size-5 ml-auto" />
          </div> */}
          {/* <div className="w-full min-h-[2px] bg-linear-to-r from-black/20 to-transparent" /> */}

          {/* Blocked Contacts */}
          <div
            onClick={() => handleMenu("blockedContacts")}
            tabIndex={0}
            className="hover:bg-[--hover-secondary] w-full flex gap-4 items-center duration-200 max-sm:px-0 px-4 py-4 rounded-2xl cursor-pointer"
          >
            <NoSymbolIcon className="size-5" />
            <label htmlFor="notification">Blocked contacts</label>
            <ChevronRightIcon className="size-5 ml-auto" />
          </div>

          {/* Active Sessions */}
          <div
            onClick={() => handleMenu("activeSessions")}
            tabIndex={0}
            className="hover:bg-[--hover-secondary] w-full flex gap-4 items-center duration-200 max-sm:px-0 px-4 py-4 rounded-2xl cursor-pointer"
          >
            <UserGroupIcon className="size-5" />
            <label htmlFor="notification">Active Sessions</label>
            <ChevronRightIcon className="size-5 ml-auto" />
          </div>

          {/* Security & Encryption */}
          <div
            onClick={() => handleMenu("securitySettings")}
            tabIndex={0}
            className="hover:bg-[--hover-secondary] w-full flex gap-4 items-center duration-200 max-sm:px-0 px-4 py-4 rounded-2xl cursor-pointer"
          >
            <ShieldCheckIcon className="size-5" />
            <label htmlFor="notification">Security & Encryption</label>
            <ChevronRightIcon className="size-5 ml-auto" />
          </div>
        </div>

        {/* Logout */}
        <div className="flex flex-col gap-6 w-full max-sm:px-0 px-4 mt-auto">
          <div
            onClick={!logoutLoading ? handleLogout : undefined}
            tabIndex={0}
            className={`btn btn-block btn-error !text-[--black-white] ${logoutLoading && "opacity-50 cursor-not-allowed"}`}
          >
            {logoutLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <ArrowLeftStartOnRectangleIcon className="size-5" />
            )}
            {logoutLoading ? "Logging out..." : "Logout"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
