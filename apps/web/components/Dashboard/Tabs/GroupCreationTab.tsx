"use client";
import React, { MouseEvent, useEffect, useMemo, useState } from "react";
import { useStore } from "../../../store/global";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { AnimatePresence, motion } from "framer-motion";
import EmojiPicker from "../../ChatWindow/components/ChatInput/EmojiPicker";
import { flip, shift, useFloating } from "@floating-ui/react";
import motionconfig from "../../../config/config";
import Avatar from "../../ui/Avatar";
import { uploadImage } from "@lib/imageKit";
import ObjectID from "bson-objectid";
import { useMenu } from "store/menu";
import Menu from "@components/ui/Menu";
import Header from "../components/Header";

const GroupCreationTab = () => {
  const { user } = useAuth();
  const { sendGroupCreationRequest } = useSocket();
  const setDashboardTab = useStore((s) => s.setDashboardTab);
  const setModal = useStore((s) => s.setModal);
  const setSelectedGroupMembers = useStore((s) => s.setSelectedGroupMembers);
  const selectedGroupMembers = useStore((s) => s.selectedGroupMembers);
  const setMenu = useMenu((s) => s.setMenu);
  const menu = useMenu((s) => s.menu);

  const [displayName, setGroupName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<HTMLDivElement | null>(null);

  const { refs, floatingStyles } = useFloating({
    middleware: [flip(), shift()],
    placement: "top-end",
    strategy: "absolute",
    transform: false,
  });

  const handleClose = () => {
    setSelectedGroupMembers(null);
    setDashboardTab("dashboard");
  };

  const handleSubmit = async () => {
    setLoading(true);
    const groupId = new ObjectID().toHexString();
    let profilePictureUrl = "";

    selectedGroupMembers.push(user!);

    if (profilePicture) {
      const callback = () => {};
      const res = await uploadImage(profilePicture, groupId, true, callback);
      profilePictureUrl = res.url;
    }

    const group = {
      id: groupId,
      channelId: new ObjectID().toHexString(),
      displayName,
      profilePicture: profilePictureUrl,
      admins: [user?.id!],
      host: "group",
      members: selectedGroupMembers,
      createdBy: user?.id!,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    sendGroupCreationRequest(group);
    setLoading(false);
    handleClose();
  };

  function handleEmoji(e: any) {
    setGroupName((s) => s.concat(e.native));
  }

  const handleDropdown = (e: MouseEvent<HTMLDivElement>) => {
    const container = reference?.getBoundingClientRect()!;
    const x = e.clientX - container.width;
    const y = e.clientY - container.height;
    setMenu({
      id: "GROUP_CREATION",
      position: { x, y },
      reference,
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
      <AnimatePresence>
        {open && (
          <div className="w-full relative z-50">
            <motion.div
              variants={motionconfig.settings}
              initial="hidden"
              exit="hidden"
              animate="visible"
              className="w-5/6 h-56 bg-base-200 rounded-xl z-50 ml-5 mt-2"
              ref={refs.setFloating}
              style={{ ...floatingStyles }}
            >
              <EmojiPicker open={open} onEmojiSelect={handleEmoji} />
            </motion.div>
            <div
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-20 "
            ></div>
          </div>
        )}
      </AnimatePresence>

      <Header title="Create Group" mainTab="addMembersToGroup" />
      <div
        ref={setReference}
        className="fixed z-50"
        style={{ top: menu?.position?.y, left: menu?.position?.x }}
      >
        <Menu id="GROUP_CREATION">
          {options.map(({ handler, label }) => (
            <Menu.Item key={label} onClick={handler}>
              {label}
            </Menu.Item>
          ))}
        </Menu>
      </div>
      <div className="flex relative flex-col items-center py-8 h-full w-full">
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
        <label className="form-control w-full max-w-sm my-auto">
          <span className="label-text text-primary">Group name</span>
          <label
            className={`border-b-primary pl-0  pr-14 bg-transparent border-b-2 rounded-none textarea relative flex justify-center items-center w-full gap-2`}
          >
            <input
              className="w-full bg-transparent outline-none"
              onChange={(e) => setGroupName(e.target.value)}
              value={displayName}
              placeholder="Type here..."
            />
            <div className="flex gap-1 items-center absolute right-0">
              <div
                onClick={() => setOpen(true)}
                ref={refs.setReference}
                tabIndex={0}
                className="flex btn btn-circle btn-ghost btn-xs "
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
                    d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
                  />
                </svg>
              </div>
            </div>
          </label>
        </label>
      </div>
      <div className="flex justify-center pb-8">
        <button
          onClick={handleSubmit}
          className="btn btn-circle btn-md btn-primary text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-7 h-7 "
          >
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
