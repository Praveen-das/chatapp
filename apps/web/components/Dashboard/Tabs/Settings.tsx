"use client";
import { MouseEvent, useMemo, useState } from "react";
import { useStore } from "../../../store/global";
import useAuth from "../../../hooks/useAuth";
import { useTheme } from "next-themes";
import Avatar from "../../ui/Avatar";
import useSocket from "../../../context/SocketProvider";
import Menu from "@components/ui/Menu";
import { useMenu } from "store/menu";
import { uploadImage } from "@lib/imageKit";
import { generateRelatedColors } from "@lib/theme";
import { Check, Plus, Xmark } from "iconoir-react";
import TextInput from "../../ui/TextInput";
import Tags from "../../ui/TagInput";
import Header from "../components/Header";

const Settings = () => {
  const { user, updateUser } = useAuth();

  const { theme } = useTheme();
  const { updateUserInfo } = useSocket();
  const setDashboardTab = useStore((s) => s.setDashboardTab);
  const setModal = useStore((s) => s.setModal);

  const setMenu = useMenu((s) => s.setMenu);
  const _menu = useMenu((s) => s.menu);

  const [reference, setReference] = useState<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);

  function handleEditUsername(text: string) {
    if (text && text !== user?.username) {
      updateUser("username", text);
      updateUserInfo({ userId: user?.id!, updates: { username: text } });
    }
  }

  function handleEditBio(text: string) {
    if (text !== user?.bio) {
      updateUser("bio", text);
      updateUserInfo({ userId: user?.id!, updates: { bio: text } });
    }
  }

  function handleAddingTag(tag: string) {
    updateUser("tags", [tag, ...(user?.tags || [])]);
  }

  function handleRemovingTag(tag: string) {
    updateUser(
      "tags",
      user?.tags.filter((tag) => tag !== tag)
    );
  }

  const handleMenu = (menu: string) => {
    setDashboardTab(menu);
  };

  function handleDeletingProfilePicture() {
    const updateUser = useAuth.getState().updateUser!;
    updateUser("profilePicture", "");
  }

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
    const container = reference?.getBoundingClientRect()!;

    const x = e.clientX - container.left;
    const y = e.clientY - container.top + 20;

    setMenu({ id: "USER_PROFILE", position: { x, y }, reference, data: null });
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

  function handleUpdatingProfilePicture(base64: string) {
    const updateUser = useAuth.getState().updateUser!;
    setLoading(true);

    uploadImage(base64, user?.id!, true).then((res) => {
      updateUser("profilePicture", res.url);
      setLoading(false);
    });
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" mainTab="dashboard" />
      <div className="flex relative flex-col max-sm:gap-8 gap-10 text-sm w-full h-full py-4 overflow-y-scroll z-50 no-scrollbar">
        <div
          ref={setReference}
          className="absolute z-50"
          style={{ top: _menu?.position?.y, left: _menu?.position?.x }}
        >
          <Menu id="USER_PROFILE">
            {options.map(({ handler, label }) => (
              <Menu.Item key={label} onClick={handler}>
                {label}
              </Menu.Item>
            ))}
          </Menu>
        </div>

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

        <div className="flex flex-col max-sm:gap-8 gap-4 max-sm:px-0 px-4">
          {/* username */}
          <TextInput
            label="Username"
            placeholderText="Add your username"
            text={user?.username!}
            onSubmit={handleEditUsername}
          />

          {/* bio */}
          <TextInput
            label="About"
            autoRaw
            placeholderText="Add your bio"
            text={user?.bio!}
            onSubmit={handleEditBio}
            onDelete={handleEditBio}
          />

          {/* tags */}
          <Tags
            tags={user?.tags || []}
            canEdit
            onSubmit={handleAddingTag}
            onDelete={handleRemovingTag}
          />
        </div>

        <div className="w-full flex flex-col">
          {/* General Settings */}
          <div
            onClick={() => handleMenu("generalSettings")}
            tabIndex={0}
            className="hover:bg-[--hover-secondary] w-full flex gap-4 items-center duration-200 max-sm:px-0 px-4 py-4 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            <label htmlFor="notification">General Settings</label>
            <div className="ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </div>
          {/* <div className="w-full min-h-[2px] bg-gradient-to-r from-black/20 to-transparent" /> */}

          {/* Blocked Contacts */}
          <div
            onClick={() => handleMenu("blockedContacts")}
            tabIndex={0}
            className="hover:bg-[--hover-secondary] w-full flex gap-4 items-center duration-200 max-sm:px-0 px-4 py-4 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <label htmlFor="notification">Blocked contacts</label>
            <div className="ml-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="flex flex-col gap-6 w-full max-sm:px-0 px-4 mt-auto">
          <div className="btn btn-primary text-white flex gap-2 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
              />
            </svg>
            Logout
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
