"use client";

// import Menu from "@components/ui/Menu";
import { flip, shift, useFloating } from "@floating-ui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import motionconfig from "../../config/config";
import useSocket from "../../context/SocketProvider";
import useSelectedConversation from "../../hooks/useSelectedConversation";
import {
  IGroupConversation,
  IGroupMember,
} from "../../interfaces/conversationInterface";
import { IUser } from "../../interfaces/userInterface";
import { useConversationStore } from "../../store/conversationStore";
import { useStore } from "../../store/global";
import EmojiPicker from "../ChatWindow/components/ChatInput/EmojiPicker";
import { Avatar } from "../Dashboard/Components/Avatar";
import AdminTag from "../ui/AdminTag";
import TextArea from "../ui/TextArea";
import MediaSelection from "./MediaSelection";
import Menu from "@components/ui/Menu";
import { uploadImage } from "@lib/imageKit";

function GroupProfile({ conversation }: { conversation: IGroupConversation }) {
  const { sendGroupInfoUpdateRequest } = useSocket();
  const toggleProfile = useStore((s) => s.toggleProfile);
  const setModal = useStore((s) => s.setModal);
  const setProfileTab = useStore((s) => s.setProfileTab);
  const setSelectedGroup = useStore((s) => s.setSelectedGroup);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState("");
  const [editGroupName, toggleEditUsername] = useState(false);
  const [editDescription, toggleEditDescription] = useState(false);

  const [displayName, setDisplayName] = useState(
    conversation.displayName || ""
  );
  const [description, setDescription] = useState(conversation.desc || "");

  const { refs, floatingStyles } = useFloating({
    middleware: [flip(), shift()],
    placement: "top-end",
    strategy: "absolute",
    transform: false,
  });

  function closeProfile() {
    const selectedConversation =
      useConversationStore.getState().selectedConversation;
    if (selectedConversation?.host === "user") setProfileTab("conversation");
    else toggleProfile(false);
    setSelectedGroup(null);
  }

  const members = useMemo(
    () => sortGroupMembers([...conversation.members]),
    [conversation]
  );

  function sortGroupMembers(members: IGroupMember[]) {
    if (!members) return [];
    return members.sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return a.username.localeCompare(b.username);
    });
  }

  function handleEditGroupName() {
    if (displayName && displayName !== conversation?.displayName)
      sendGroupInfoUpdateRequest(conversation, { displayName: displayName });
    toggleEditUsername((s) => !s);
    setDisplayName("");
    setOpen("");
  }

  function handleEditGroupDescription() {
    if (description && description !== conversation?.desc)
      sendGroupInfoUpdateRequest(conversation, { desc: description });

    toggleEditDescription((s) => !s);
    setDescription("");
    setOpen("");
  }

  function toggleEmojiPicker(value: string) {
    setOpen((s) => (s !== value ? value : ""));
  }

  function toggleModal(activeModal: string) {
    setModal({ activeModal });
    (
      document?.getElementById("action-modal") as HTMLDialogElement
    )?.showModal();
  }

  function handleExitingGroup() {
    setModal({ activeModal: "groupExitModal" });
    (
      document?.getElementById("action-modal") as HTMLDialogElement
    )?.showModal();
  }

  const handleEmoji = (emoji: any) => {
    open === "displayName"
      ? setDisplayName((s) => s.concat(emoji.native))
      : setDescription((s) => s.concat(emoji.native));
  };

  function handleDeletingProfilePicture() {
    sendGroupInfoUpdateRequest(conversation, { profilePicture: "" });
  }

  function handleUpdatingProfilePicture(file: File) {
    function callback(key: string, base64: string) {
      setLoading(true);
      uploadImage(base64, conversation.id, true).then((res) => {
        sendGroupInfoUpdateRequest(conversation, { [key]: res.url });
        setLoading(false);
      });
    }

    setModal({
      activeModal: "uploadProfilePictureModal",
      state: { file, callback },
    });
    document.querySelector<HTMLDialogElement>("#action-modal")?.showModal();
  }

  function openViewProfilePictureModal() {
    setModal({
      activeModal: "viewProfilePictureModal",
      state: {
        url: conversation.profilePicture,
        displayName: conversation.displayName,
      },
    });
    document.querySelector<HTMLDialogElement>("#action-modal")?.showModal();
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="relative z-50">
            <motion.div
              variants={motionconfig.settings}
              initial="hidden"
              exit="hidden"
              animate="visible"
              className="w-5/6 h-56 bg-base-200 rounded-xl z-50 ml-5 mt-2"
              ref={refs.setFloating}
              style={{ ...floatingStyles }}
            >
              <EmojiPicker open={!!open} onEmojiSelect={handleEmoji} />
            </motion.div>
            <div
              onClick={() => setOpen("")}
              className="fixed inset-0 z-20 "
            ></div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="min-h-16 w-full flex items-center gap-4 px-4">
        <button
          onClick={closeProfile}
          className={`btn btn-sm btn-ghost btn-circle`}
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
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
        </button>
        <label htmlFor="contact info">Group info</label>
      </div>

      {/* Profile details */}
      <div className="flex gap-6 text-sm flex-col overflow-y-scroll py-6 no-scrollbar">
        {/* profile */}
        <div className="w-full flex flex-col gap-2 items-center ">
          <Avatar
            loading={loading}
            size="160px"
            url={conversation.profilePicture}
            menu={Boolean(conversation.profilePicture)}
            onlineIndication={false}
            canChangeAvatar
            onDelete={handleDeletingProfilePicture}
            onChange={handleUpdatingProfilePicture}
            onPreview={openViewProfilePictureModal}
          />
          <div className="w-full px-8">
            <label
              className={`${editGroupName ? "border-b-primary pl-0  pr-14" : "border-b-transparent"} bg-transparent border-b-2 rounded-none textarea relative flex justify-center items-center w-full gap-2`}
            >
              {editGroupName ? (
                <>
                  <TextArea
                    className="text-nowrap"
                    onChange={(e) => setDisplayName(e.target.value)}
                    value={displayName}
                  />
                  <div className="flex gap-1 items-center absolute right-0">
                    <div
                      onClick={() => toggleEmojiPicker("displayName")}
                      ref={
                        open === "displayName" ? refs.setReference : undefined
                      }
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
                    <div
                      onClick={handleEditGroupName}
                      tabIndex={0}
                      className="btn btn-circle btn-ghost btn-xs "
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="size-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative">
                  <label className="mx-2" htmlFor="">
                    {conversation?.displayName}
                  </label>
                  <div
                    onClick={handleEditGroupName}
                    tabIndex={0}
                    className="absolute btn btn-circle btn-ghost btn-xs "
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="w-full min-h-[2px] bg-black/20" />

        <div className="grid relative px-8">
          {conversation.desc && (
            <label className="text-sm text-primary" htmlFor="About">
              Description
            </label>
          )}
          <label
            className={`${editDescription ? "border-b-primary" : "border-b-transparent"} pl-0 bg-transparent border-b-2 rounded-none textarea relative flex justify-between w-full pr-12`}
          >
            {editDescription ? (
              <>
                <TextArea
                  onChange={(e) => setDescription(e.target.value)}
                  value={description}
                />
                <div className="flex gap-1 items-center absolute right-0">
                  <div
                    onClick={() => toggleEmojiPicker("desc")}
                    ref={open === "desc" ? refs.setReference : undefined}
                    tabIndex={0}
                    className="btn btn-circle btn-ghost btn-xs "
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
                  <div
                    onClick={handleEditGroupDescription}
                    tabIndex={0}
                    className="btn btn-circle btn-ghost btn-xs "
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
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <>
                {conversation.desc ? (
                  <p className="leading-7 whitespace-pre-wrap">
                    {conversation.desc}
                  </p>
                ) : (
                  <p className="leading-7 whitespace-pre-wrap text-primary">
                    Add group description
                  </p>
                )}
                <div
                  onClick={handleEditGroupDescription}
                  tabIndex={0}
                  className="absolute right-0 btn btn-circle btn-ghost btn-xs"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                    />
                  </svg>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Media */}
        <MediaSelection conversationId={conversation.id} />

        {/* conversation members */}
        <div className="w-full flex flex-col">
          <div className="flex gap-4 px-8">
            <label className="text-sm text-primary mb-2 " htmlFor="">
              Group members
            </label>
            {conversation?.members.length}
          </div>
          <div className="flex gap-1 flex-col w-full ">
            <div
              tabIndex={0}
              onClick={() => toggleModal("addGroupMembersModal")}
              className="hover:bg-[--hover-secondary] duration-200  w-full flex items-center gap-4 px-8 py-3 cursor-pointer"
            >
              <div className="flex items-center justify-center w-[40px] h-[40px] bg-gray-500 rounded-full">
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
                    d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                  />
                </svg>
              </div>
              Add Member
            </div>
            <div
              onClick={() => setProfileTab("inviteLink")}
              tabIndex={0}
              className="hover:bg-[--hover-secondary] duration-200  w-full flex items-center gap-4 px-8 py-3 cursor-pointer"
            >
              <div className="flex items-center justify-center w-[40px] h-[40px] bg-gray-500 rounded-full">
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
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                  />
                </svg>
              </div>
              Invite via link
            </div>
            {members.map(
              (member, i) => i < 5 && <Member key={member.id} member={member} />
            )}
            <div
              onClick={() => toggleModal("allMembers")}
              tabIndex={0}
              className="hover:bg-[--hover-secondary] duration-200  p-4 flex justify-center items-center cursor-pointer"
            >
              View all members
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 px-8">
          <div
            onClick={handleExitingGroup}
            tabIndex={0}
            className="btn btn-block btn-outline btn-error"
          >
            Exit Group
          </div>
        </div>
        <label
          className="text-xs text-center text-base-content/50 px-8"
          htmlFor=""
        >
          {"Created By " + conversation.createdBy}
        </label>
      </div>
    </>
  );
}

function Member({ member }: { member: IGroupMember }) {
  const { removeMemberFromGroup, makeAdmin, removeFromAdmin } =
    useSocket();
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const selectedConversation = useSelectedConversation() as IGroupConversation;
  const setProfileTab = useStore((s) => s.setProfileTab);

  function handleRemovingMember(user: IGroupMember) {
    removeMemberFromGroup(selectedConversation, user);
  }

  function handleAdmin(userId: string, action: string) {
    if (action === "add") makeAdmin(selectedConversation.id, userId);
    else removeFromAdmin(selectedConversation.id, userId);
  }

  function handleSelectedUser() {
    setSelectedUser(member as IUser);
    setProfileTab("user");
  }

  const options = useMemo(() => {
    return [
      {
        label: member.isAdmin ? "Remove Admin" : "Make Admin",
        handler: () =>
          handleAdmin(member.id!, member.isAdmin ? "remove" : "add"),
      },
      {
        label: "Remove",
        handler: () => handleRemovingMember(member),
      },
    ];
  }, [member]);

  return (
    <div
      key={member.id}
      className="group hover:bg-[--hover-secondary] duration-200  w-full flex items-center gap-4 px-8 py-3 cursor-pointer"
      onClick={handleSelectedUser}
    >
      <Avatar
        url={member.profilePicture}
        profileHidden={!member.rules?.profilePicture.isVisible}
        size="40px"
        onlineIndication={false}
      />
      <div className="w-full flex flex-col justify-center">
        <div className="flex justify-between items-center w-full">
          <label className="py-1" htmlFor="member name">
            {member.username}
          </label>
          <AdminTag isAdmin={member.isAdmin} />
        </div>
        <div className="flex justify-between items-center">
          <label className="text-sm" htmlFor="">
            zxczx, zxczxczxc, zxczxc
          </label>
          <Menu
            buttonIcon={
              <span className="group-hover:opacity-100 btn btn-circle btn-xs btn-ghost outline-none duration-300 rounded-full opacity-0 -mb-4">
                <ChevronDownIcon className="size-5" />
              </span>
            }
            menuItems={options}
            placement={self ? "bottom-end" : "bottom-start"}
            dense
          />
        </div>
      </div>
    </div>
  );
}

export default GroupProfile;
