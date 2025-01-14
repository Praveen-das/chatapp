"use client";

import { useStore } from "../../store/global";
import Avatar from "../ui/Avatar";
import { useConversationStore } from "../../store/conversationStore";
import useAuth from "../../hooks/useAuth";
import MediaSelection from "./MediaSelection";
import useSocket from "../../context/SocketProvider";
import { useMessageStore } from "../../store/messageStore";
import { IUser } from "../../interfaces/userInterface";
import {
  IGroupConversation,
  IUserConversation,
} from "../../interfaces/conversationInterface";
import StarredMessages from "./StarredMessages";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import NotificationToggle from "./NotificationToggle";
import { useTheme } from "next-themes";
import { generateRelatedColors } from "@lib/theme";
import TagInput from "@components/ui/TagInput";

function UserProfile({
  user,
  showChatOption = false,
}: {
  user: IUser;
  showChatOption?: boolean;
}) {
  const {
    sendUserBlockRequest,
    sendUserUnBlockRequest,
    sendConversationDeleteRequest,
  } = useSocket();

  const setModal = useStore((s) => s.setModal);
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const conversations = useConversationStore((s) => s.conversations);
  const updateConversation = useConversationStore((s) => s.updateConversation);
  const conversation = conversations.find(
    (c) => c.host === "user" && c.members.find((m) => m.id === user.id)
  ) as IUserConversation;
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const toggleProfile = useStore((s) => s.toggleProfile);
  const setProfileTab = useStore((s) => s.setProfileTab);
  const setDeviceTab = useStore((s) => s.setDeviceTab);
  const clearChat = useMessageStore((s) => s.clearChat);

  const blockedConversation = conversation?.blocked;

  function closeProfile() {
    const selectedConversation =
      useConversationStore.getState().selectedConversation;
      
    if (selectedConversation?.host === "group") setProfileTab("conversation");
    else toggleProfile(false);

    setSelectedUser(null);
  }

  function toggleChat() {
    setSelectedConversation(null);
    toggleProfile(false);
  }

  const handleDeletingConversation = () => {
    if (!conversation) return;
    let conversationId = conversation.id;

    sendConversationDeleteRequest(conversationId);
    updateConversation(conversationId, { active: false, archived: false });
    clearChat(conversationId);
    toggleProfile(false);
    setSelectedConversation(null);
    setDeviceTab("");
  };

  const handleBlockingUser = () => {
    if (blockedConversation) sendUserUnBlockRequest(conversation);
    else sendUserBlockRequest(conversation);
  };

  function openViewProfilePictureModal() {
    setModal({
      activeModal: "viewProfilePictureModal",
      state: {
        url: user?.profilePicture,
        displayName: user?.username,
      },
      open: true,
    });
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
        <label htmlFor="contact info">Chat info</label>
      </div>

      {/* Profile details */}
      <div className="flex h-full gap-8 max-sm:pt-2 pt-4 bg-gradient-to-t from-base-200 text-sm flex-col overflow-y-scroll max-sm:pb-3 pb-10 no-scrollbar">
        {/* profile */}
        <div className="flex gap-8 items-center max-sm:px-4 px-8">
          <Avatar
            url={user.profilePicture}
            profileHidden={!user?.rules?.profilePicture.isVisible}
            size="70px"
            onlineIndication={false}
            onClick={openViewProfilePictureModal}
          />
          <div className="flex flex-col gap-2">
            <label className="text-base text-base-content" htmlFor="">
              {user?.username}
            </label>
            <div className="-ml-1">{user?.phonenumber}</div>
          </div>
        </div>

        {/* about */}
        {user.bio && user?.rules?.bio.isVisible && (
          <div className="w-full flex flex-col max-sm:px-4 px-8">
            <p className="leading-7">{user.bio}</p>
          </div>
        )}

        {/* Tags */}
        {!!user.tags.length && (
          <div className="max-sm:px-4 px-8">
            <TagInput showLabel={false} tags={user.tags} />
          </div>
        )}

        <div className="space-y-1 divide-y-2 divide-base-300 max-sm:mt-2 sm:mt-4 max-sm:px-4 px-8 [&>div]:h-16">
          <NotificationToggle id={user.id} />
          <StarredMessages />
          <MediaSelection conversationId={conversation?.id!} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto max-sm:px-4 px-8">
          {showChatOption && (
            <div
              onClick={toggleChat}
              tabIndex={0}
              className="btn btn-block bg-base-100"
            >
              Chat
            </div>
          )}
          <div
            onClick={handleBlockingUser}
            tabIndex={0}
            className="btn btn-block bg-base-100"
          >
            {blockedConversation ? "Unblock" : "Block"} {user?.username}
          </div>
          {conversation?.host === "user" && conversation.active && (
            <div
              onClick={handleDeletingConversation}
              tabIndex={0}
              className="btn btn-block bg-base-100"
            >
              Delete chat
            </div>
          )}
        </div>
      </div>
    </div>
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
      className="hover:bg-[--hover-secondary] w-full flex items-center gap-4 max-sm:px-4 px-8 py-3 cursor-pointer"
    >
      <Avatar url={group.profilePicture} onlineIndication={false} size="40px" />
      <div className="flex flex-col justify-center pointer-events-none">
        <label htmlFor="">{group.displayName}</label>
      </div>
    </div>
  );
}

export default UserProfile;
