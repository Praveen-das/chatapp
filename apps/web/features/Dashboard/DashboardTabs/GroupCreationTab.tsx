"use client";
import React, { MouseEvent, useMemo, useState } from "react";
import { useStore } from "../../../store/global";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import Avatar from "../../ui/Avatar";
import { uploadImage } from "@lib/imageKit";
import ObjectID from "bson-objectid";
import { useMenu } from "store/menu";
import Menu from "@features/ui/Menu";
import Header from "./SharedComponents/Header";
import { Input } from "../../ui/Input";
import useAxios from "@hooks/useAxios";

const GroupCreationTab = () => {
  const { user } = useAuth();
  const axios = useAxios();
  const { sendGroupCreationRequest } = useSocket();
  const setDashboardTab = useStore((s) => s.setDashboardTab);
  const setSelectedGroupMembers = useStore((s) => s.setSelectedGroupMembers);
  const selectedGroupMembers = useStore((s) => s.selectedGroupMembers);
  const setMenu = useMenu((s) => s.setMenu);
  const menu = useMenu((s) => s.menu);

  const [displayName, setGroupName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setSelectedGroupMembers(null);
    setDashboardTab("dashboard");
  };

  const handleSubmit = async () => {
    setLoading(true);
    const groupId = new ObjectID().toHexString();
    const group = {
      id: groupId,
      channelId: new ObjectID().toHexString(),
      displayName,
      profilePicture,
      admins: [user?.id!],
      host: "group",
      members: selectedGroupMembers,
      createdBy: user?.id!,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    selectedGroupMembers.push(user!);

    if (profilePicture) {
      const res = await uploadImage(profilePicture, groupId, true);
      group.profilePicture = res.url;
    }

    try {
      const res = await axios.post("/db/group/create", JSON.stringify(group));
      sendGroupCreationRequest(group);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const handleDropdown = (e: MouseEvent<HTMLDivElement>) => {
    setMenu({
      id: "GROUP_CREATION",
      reference:e,
      data: null,
    });
  };

  const options = useMemo(() => {
    return [
      // {
      //   label: "View image",
      //   handler: openViewProfilePictureModal,
      // },
      {
        label: "Change image",
        handler: () => document.getElementById("group_creation")?.click(),
      },
      {
        label: "Delete image",
        handler: handleDeletingProfilePicture,
      },
    ];
  }, []);

  function handleDeletingProfilePicture() {
    setProfilePicture("");
  }

  function handleUpdatingProfilePicture(base64: string) {
    setProfilePicture(base64);
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Create Group" mainTab="addMembersToGroup" />
      <div className="flex relative flex-col items-center justify-around px-6 pb-8 h-full w-full">
        <Menu id="GROUP_CREATION" clientPoint>
          {options.map(({ handler, label }) => (
            <Menu.Item key={label} onClick={handler}>
              {label}
            </Menu.Item>
          ))}
        </Menu>
        <Avatar
          id="group_creation"
          size="160px"
          url={profilePicture}
          loading={loading}
          onlineIndication={false}
          onClick={handleDropdown}
          onChange={handleUpdatingProfilePicture}
          enableOptions
        />
        <Input label="Group name" value={displayName} onChange={setGroupName} />
      </div>
      <div className="flex justify-center pb-8">
        <button onClick={handleSubmit} className="btn btn-circle btn-md btn-primary text-[--black-white]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7 ">
            <path
              fillRule="evenodd"
              d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GroupCreationTab;
