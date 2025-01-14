"use client";

// import Menu from "@components/ui/Menu";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { MouseEvent, useMemo, useState } from "react";
import useSocket from "../../context/SocketProvider";
import {
  IGroupConversation,
  IGroupMember,
} from "../../interfaces/conversationInterface";
import { IUser } from "../../interfaces/userInterface";
import { useConversationStore } from "../../store/conversationStore";
import { useStore } from "../../store/global";
import Avatar from "../ui/Avatar";
import AdminTag from "../ui/AdminTag";
import MediaSelection from "./MediaSelection";
import { uploadImage } from "@lib/imageKit";
import { IModalKey } from "@interfaces/modalInterface";
import { useMenu } from "store/menu";
import Menu from "@components/ui/Menu";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import NotificationToggle from "./NotificationToggle";
import StarredMessages from "./StarredMessages";
import TextInput from "@components/ui/TextInput";
import TagInput from "@components/ui/TagInput";
import useAuth from "@hooks/useAuth";

function GroupProfile({ conversation }: { conversation: IGroupConversation }) {
  const { user } = useAuth();
  const {
    removeMemberFromGroup,
    makeAdmin,
    removeFromAdmin,
    sendGroupInfoUpdateRequest,
  } = useSocket();

  const toggleProfile = useStore((s) => s.toggleProfile);
  const setModal = useStore((s) => s.setModal);
  const setProfileTab = useStore((s) => s.setProfileTab);
  const setSelectedGroup = useStore((s) => s.setSelectedGroup);

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
  const userIsAdmin = conversation.admins.includes(user?.id!);
  const totalMembers = conversation.members.length;

  function sortGroupMembers(members: IGroupMember[]) {
    if (!members) return [];
    return members.sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return a.username.localeCompare(b.username);
    });
  }

  function handleEditGroupName(displayName: string) {
    if (displayName && displayName !== conversation?.displayName)
      sendGroupInfoUpdateRequest(conversation, { displayName: displayName });
  }

  function handleEditGroupDescription(description: string) {
    if (description && description !== conversation?.desc)
      sendGroupInfoUpdateRequest(conversation, { desc: description });
  }

  function toggleModal(activeModal: IModalKey) {
    setModal({ activeModal, open: true });
  }

  function handleExitingGroup() {
    setModal({
      activeModal: "groupExitModal",
      state: conversation,
      open: true,
    });
  }

  function handleAdmin(userId: string, action: string) {
    if (action === "add") makeAdmin(conversation.conversationId, userId);
    else removeFromAdmin(conversation.conversationId, userId);
  }

  function handleRemovingMember(user: IGroupMember) {
    removeMemberFromGroup(conversation, user);
  }

  return (
    <div className='w-full h-full flex flex-col'>
      {/* Header */}
      <div className="min-h-16 w-full flex items-center max-sm:gap-2 gap-4 max-sm:px-2 px-4">
        <button
          onClick={closeProfile}
          className={`btn btn-sm btn-ghost btn-circle`}
        >
          <ChevronRightIcon className="size-5" />
        </button>
        <label htmlFor="contact info">Group info</label>
      </div>

      {/* Profile details */}
      <div className="flex h-full gap-8 max-sm:pt-2 pt-4 bg-gradient-to-t from-base-200 text-sm flex-col overflow-y-scroll max-sm:pb-3 pb-10 no-scrollbar">
        {/* profile */}

        <div className="flex gap-8 items-center max-sm:px-4 px-8">
          <AvatarWrapper
            conversation={conversation}
            userIsAdmin={userIsAdmin}
          />

          <div className="grid">
            <TextInput
              text={conversation?.displayName!}
              className="text-base"
              placeholderText="Add group description"
              onSubmit={handleEditGroupName}
              canEdit={userIsAdmin}
              // onDelete={handleEditBio}
            />
            <div>{`Group - ${totalMembers} members`}</div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="max-sm:px-4 px-8">
            <TextInput
              autoRaw
              placeholderText="Add group description"
              text={conversation?.desc!}
              onSubmit={handleEditGroupDescription}
              canEdit={userIsAdmin}
              // onDelete={handleEditBio}
            />
          </div>

          <div className="max-sm:px-4 px-8">
            <TagInput
              tags={["asdads", "qweqwe", "zxczxc"]}
              showLabel={false}
              canEdit={userIsAdmin}
            />
          </div>
        </div>

        {/* Media */}
        <div className="space-y-1 divide-y-2 divide-base-300 max-sm:mt-2 sm:mt-4 max-sm:px-4 px-8 [&>div]:h-16">
          <NotificationToggle id={conversation.id} />
          <StarredMessages />
          <MediaSelection conversationId={conversation?.id!} />
        </div>

        {/* conversation members */}
        <div className="w-full flex flex-col">
          <div className="flex gap-4 max-sm:px-4 px-8">
            <label className="text-sm text-primary mb-2 " htmlFor="">
              Group members
            </label>
            {totalMembers}
          </div>
          <div className="flex gap-1 flex-col w-full ">
            {userIsAdmin && (
              <div
                tabIndex={0}
                onClick={() => toggleModal("addGroupMembersModal")}
                className="hover:bg-[--hover-secondary] duration-200  w-full flex items-center gap-4 max-sm:px-4 px-8 py-3 cursor-pointer"
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
            )}

            {/* {conversation.invitationId && (
            )} */}
            <div
              onClick={() => setProfileTab("inviteLink")}
              tabIndex={0}
              className="hover:bg-[--hover-secondary] duration-200  w-full flex items-center gap-4 max-sm:px-4 px-8 py-3 cursor-pointer"
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

            <Menu<IGroupMember> id="groupProfile">
              {(member) => (
                <>
                  <Menu.Item
                    onClick={() =>
                      handleAdmin(member.id!, member.isAdmin ? "remove" : "add")
                    }
                  >
                    {member.isAdmin ? "Remove Admin" : "Make Admin"}
                  </Menu.Item>
                  <Menu.Item onClick={() => handleRemovingMember(member)}>
                    Remove
                  </Menu.Item>
                </>
              )}
            </Menu>

            <div>
              {members.map(
                (member, i) =>
                  i < 5 && (
                    <Member
                      showOptions={userIsAdmin}
                      key={member.id}
                      member={member}
                    />
                  )
              )}
            </div>
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
        <div className="flex flex-col gap-2 max-sm:px-4 px-8 mt-auto">
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
    </div>
  );
}

function Member({
  member,
  showOptions = false,
}: {
  member: IGroupMember;
  showOptions?: boolean;
}) {
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const setProfileTab = useStore((s) => s.setProfileTab);
  const setMenu = useMenu((s) => s.setMenu);

  function handleSelectedUser() {
    setSelectedUser(member as IUser);
    setProfileTab("user");
  }

  return (
    <div
      key={member.id}
      className="group hover:bg-[--hover-secondary] duration-200  w-full flex items-center gap-4 max-sm:px-4 px-8 max-sm:py-2 py-3 cursor-pointer"
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
          {showOptions && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setMenu({
                  reference: e.currentTarget,
                  data: member,
                  id: "groupProfile",
                });
              }}
              tabIndex={0}
              className="group-hover:opacity-100 btn btn-circle btn-xs btn-ghost outline-none duration-300 rounded-full opacity-0 "
            >
              <ChevronDownIcon className="size-5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AvatarWrapper({
  conversation,
  userIsAdmin,
}: {
  conversation: IGroupConversation;
  userIsAdmin: boolean;
}) {
  const { sendGroupInfoUpdateRequest } = useSocket();
  const setMenu = useMenu((s) => s.setMenu);
  const menu = useMenu((s) => s.menu);
  const setModal = useStore((s) => s.setModal);

  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<HTMLDivElement | null>(null);

  const handleDropdown = (e: MouseEvent<HTMLDivElement>) => {
    const container = reference?.getBoundingClientRect()!;

    const x = e.clientX - container.left;
    const y = e.clientY;

    setMenu({ id: "GROUP_PROFILE", position: { x, y }, reference, data: null });
  };

  function handleUpdatingProfilePicture(base64: string) {
    setLoading(true);
    uploadImage(base64, conversation.conversationId, true).then((res) => {
      sendGroupInfoUpdateRequest(conversation, { profilePicture: res.url });
      setLoading(false);
    });
  }

  const options = useMemo(() => {
    return [
      {
        label: "View image",
        handler: openViewProfilePictureModal,
      },
      {
        label: "Change image",
        handler: () => document.getElementById("group_avatar")?.click(),
      },
      {
        label: "Delete image",
        handler: handleDeletingProfilePicture,
      },
    ];
  }, []);

  function handleDeletingProfilePicture() {
    sendGroupInfoUpdateRequest(conversation, { profilePicture: "" });
  }

  function openViewProfilePictureModal() {
    setModal({
      activeModal: "viewProfilePictureModal",
      state: {
        url: conversation.profilePicture,
        displayName: conversation.displayName,
      },
      open: true,
    });
  }

  return (
    <>
      <div
        ref={setReference}
        className="absolute z-50"
        style={{ top: menu?.position?.y, left: menu?.position?.x }}
      >
        <Menu id="GROUP_PROFILE">
          {options.map(({ handler, label }) => (
            <Menu.Item key={label} onClick={handler}>
              {label}
            </Menu.Item>
          ))}
        </Menu>
      </div>

      <Avatar
        id="group_avatar"
        size="70px"
        url={conversation.profilePicture}
        onlineIndication={false}
        loading={loading}
        onClick={handleDropdown}
        onChange={handleUpdatingProfilePicture}
        enableOptions={userIsAdmin}
      />
    </>
  );
}

export default GroupProfile;
