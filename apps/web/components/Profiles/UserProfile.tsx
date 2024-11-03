"use client";

import { useStore } from "../../store/global";
import moment from "moment";
import Avatar from "../Dashboard/Components/Avatar";
import { useConversationStore } from "../../store/conversationStore";
import useAuth from "../../hooks/useAuth";
import MediaSelection from "./MediaSelection";
import { getRelativeTime } from "@lib/utils";
import useSocket from "../../context/SocketProvider";
import useSelectedConversation from "../../hooks/useSelectedConversation";
import useSelectedUser from "../../hooks/useSelectedUser";
import { useMessageStore } from "../../store/messageStore";
import { IUser } from "../../interfaces/userInterface";
import { IGroupConversation } from "../../interfaces/conversationInterface";
import ObjectID from "bson-objectid";

function UserProfile({
  user,
  showChatOption = false,
}: {
  user: IUser;
  showChatOption?: boolean;
}) {
  const { user: currentUser } = useAuth();
  const {
    sendUserBlockRequest,
    sendUserUnBlockRequest,
    blockedUsers,
    sendConversationDeleteRequest,
  } = useSocket();

  const setModal = useStore((s) => s.setModal);
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const conversations = useConversationStore((s) => s.conversations);
  const deleteConversation = useConversationStore((s) => s.deleteConversation);
  const conversation = conversations.find(
    (c) => c.host === "user" && c.members.find((m) => m.id === user.id)
  );
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const toggleProfile = useStore((s) => s.toggleProfile);
  const setProfileTab = useStore((s) => s.setProfileTab);
  const setDeviceTab = useStore((s) => s.setDeviceTab);
  const clearChat = useMessageStore((s) => s.clearChat);

  const isOnline = user?.status === "online";
  const lastSeen = getRelativeTime(user?.lastSeen!);
  const blockedUser = blockedUsers.find((u) => u.blockedUser.id === user?.id!);

  function closeProfile() {
    const selectedConversation =
      useConversationStore.getState().selectedConversation;
    if (selectedConversation?.host === "group") setProfileTab("conversation");
    else {
      toggleProfile(false);
    }
    // setSelectedUser(null);
  }

  const groupsInCommon = conversations.filter((c): c is IGroupConversation => {
    const hasCurrentUser = c.members.some((m) => m.id === currentUser?.id);
    const hasUser = c.members.some((m) => m.id === user?.id);
    return hasCurrentUser && hasUser && c.host === "group";
  });

  function toggleChat() {
    setSelectedConversation(null);
    toggleProfile(false);
  }

  const handleDeletingConversation = () => {
    if (!conversation) return;
    let conversationId = conversation.id;

    let req = {
      conversation,
      userId: currentUser?.id!,
      deletedForUser: true,
      timeOfDeletion: Date.now(),
    };

    sendConversationDeleteRequest(req);
    deleteConversation(conversationId, currentUser?.id!);
    clearChat(conversationId);
    toggleProfile(false);
    setSelectedConversation(null);
    setDeviceTab("");
  };

  const handleBlockingUser = () => {
    const req = {
      id: new ObjectID().toHexString(),
      user: currentUser!,
      blockedUser: user!,
    };

    if (blockedUser) sendUserUnBlockRequest(blockedUser);
    else sendUserBlockRequest(req);
  };

  function openViewProfilePictureModal() {
    setModal({
      activeModal: "viewProfilePictureModal",
      state: {
        url: user?.profilePicture,
        displayName: user?.username,
      },
    });
    document.querySelector<HTMLDialogElement>("#action-modal")?.showModal();
  }

  return (
    <>
      {/* Header */}
      <div className="min-h-16 w-full flex items-center max-sm:gap-2 gap-4 max-sm:px-2 px-4">
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
        <label htmlFor="contact info">Contact info</label>
      </div>
      {/* Profile details */}
      <div className="flex h-full gap-6 text-sm flex-col overflow-y-scroll max-sm:py-3 py-6 no-scrollbar">
        {/* profile */}
        <div className="w-full flex flex-col gap-2 items-center ">
          <Avatar
            url={user.profilePicture}
            profileHidden={!user?.rules?.profilePicture.isVisible}
            size="160px"
            onlineIndication={false}
            onClick={openViewProfilePictureModal}
          />
          <label className="text-lg mt-6 text-base-content" htmlFor="">
            {user?.username}
          </label>
          {(isOnline || user?.rules?.lastSeen.isVisible) && (
            <label className="text-sm text-base-content/50" htmlFor="">
              {isOnline ? "Online" : lastSeen}
            </label>
          )}
          {showChatOption && (
            <div className="flex flex-col items-center gap-2 text-xs">
              <div
                onClick={toggleChat}
                tabIndex={0}
                className="btn btn-circle btn-primary text-white mt-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              Chat
            </div>
          )}
        </div>
        <div className="w-full min-h-[2px] bg-black/20" />

        {/* about */}
        {user?.rules?.bio.isVisible && (
          <div className="w-full flex flex-col max-sm:px-4 px-8">
            <label className="text-sm text-primary" htmlFor="">
              About
            </label>
            <p className="leading-7">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime
              est exercitationem laboriosam ipsum doloribus blanditiis, alias
            </p>
          </div>
        )}

        {/* Media */}
        <MediaSelection conversationId={conversation?.id!} />
        {/* <div className="w-full min-h-[2px] bg-black/20 -mt-6" /> */}

        {/* Common groups */}
        {!!groupsInCommon.length && (
          <div className="w-full flex flex-col">
            <label className="text-sm text-primary mb-2 px-8" htmlFor="">
              Group in common
            </label>
            <div className="flex flex-col w-full ">
              {groupsInCommon.map((group) => (
                <Group key={group.id} group={group} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto max-sm:px-4 px-8">
          {conversation?.host === "user" &&
            !conversation.deletedUsers?.includes(user.id) && (
              <div
                onClick={handleDeletingConversation}
                tabIndex={0}
                className="btn btn-block btn-outline btn-error"
              >
                Delete chat
              </div>
            )}
          <div
            onClick={handleBlockingUser}
            tabIndex={0}
            className="btn btn-block btn-outline btn-error"
          >
            {blockedUser ? "Unblock" : "Block"} {user?.username}
          </div>
        </div>
        {/* <div className="w-full min-h-[2px] bg-black/20" /> */}
      </div>
    </>
  );
}

function Group({ group }: { group: IGroupConversation }) {
  const setProfileTab = useStore((s) => s.setProfileTab);
  const setSelectedGroup = useStore((s) => s.setSelectedGroup);

  function handleSelectedGroup() {
    setSelectedGroup(group);
    setProfileTab("group");
  }

  return (
    <div
      onClick={handleSelectedGroup}
      className="hover:bg-[--hover-secondary] w-full flex items-center gap-4 px-8 py-3 cursor-pointer"
    >
      <Avatar url={group.profilePicture} onlineIndication={false} size="40px" />
      <div className="flex flex-col justify-center pointer-events-none">
        <label htmlFor="">{group.displayName}</label>
      </div>
    </div>
  );
}

export default UserProfile;
