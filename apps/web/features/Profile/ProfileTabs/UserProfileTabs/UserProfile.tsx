"use client";

import TagInput from "@features/ui/TagInput";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import useConversation from "@hooks/useConversation";
import useUserConversation from "@hooks/useUserConversation";
import { IConversation, IGroupConversation } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { memo, useCallback } from "react";
import useSocket from "../../../../context/SocketProvider";
import { useConversationStore } from "../../../../store/conversationStore";
import { useStore } from "../../../../store/global";
import { useMessageStore } from "../../../../store/messageStore";
import Avatar from "../../../ui/Avatar";
import MediaSelection from "../SharedComponents/MediaSelection";
import NotificationToggle from "../SharedComponents/NotificationToggle";
import StarredMessages from "../SharedComponents/StarredMessages";
import { ProfileHeader, ProfileCard } from "../SharedComponents/ProfileLayouts";

function UserProfile({ user, showChatOption = false }: { user: IUser; showChatOption?: boolean }) {
  const { sendUserBlockRequest, sendUserUnBlockRequest, sendConversationDeleteRequest } = useSocket();

  const setModal = useStore((s) => s.setModal);
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const userConversation = useUserConversation(user.id);
  const { updateConversation, setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const profileTab = useStore((s) => s.profileTab);
  const setDeviceTab = useStore((s) => s.setDeviceTab);
  const clearChat = useMessageStore((s) => s.clearChat);
  const { startConversation } = useConversation();

  const blockedConversation = userConversation?.blocked;

  function closeProfile() {
    profileTab.back();
    useConversationStore.getState().selectedConversation && setSelectedUser(null);
  }

  function handleStartingConversation() {
    startConversation(user);
    toggleProfile(false);
  }

  const handleDeletingConversation = () => {
    if (!userConversation) return;
    let conversationId = userConversation.id;

    sendConversationDeleteRequest(conversationId);
    updateConversation(conversationId, { active: false, archived: false });
    clearChat(conversationId);
    toggleProfile(false);
    setSelectedConversation(null);
    setDeviceTab("");
  };

  const handleBlockingUser = () => {
    if (blockedConversation) sendUserUnBlockRequest(userConversation);
    else sendUserBlockRequest(userConversation);
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

  const isCommonGroup = useCallback(
    (c: IConversation): c is IGroupConversation => {
      return c.host === "group" && c.members.some((m) => m.userId === user.id);
    },
    [user],
  );

  const commonGroups = useConversationStore.getState().conversations.filter(isCommonGroup);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <ProfileHeader title="Chat info" onBack={closeProfile} />

      {/* Profile details */}
      <div className="flex-1 flex relative gap-6 pt-4 text-sm flex-col overflow-y-auto pb-10 no-scrollbar">
        {/* Profile Card */}
        <div className="flex gap-6 items-center px-4 py-4 border-b border-base-content/5">
          <Avatar
            url={user.profilePicture}
            profileHidden={Boolean(user.rules?.includes("hide_profilepicture"))}
            size="80px"
            onlineIndication={false}
            onClick={openViewProfilePictureModal}
          />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-lg font-bold text-base-content truncate">{user?.username}</span>
            {user?.phoneNumber && <span className="text-xs text-base-content/50">+{user.phoneNumber}</span>}
          </div>
        </div>

        {/* Contact Details Card */}
        {((user.bio && !user?.rules?.includes("hide_bio")) || !!user.tags?.length) && (
          <ProfileCard title="Contact Details">
            {user.bio && !user?.rules?.includes("hide_bio") && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-base-content/40 font-medium pl-0.5">Bio</span>
                <p className="text-sm text-base-content/80 leading-relaxed pl-0.5">{user.bio}</p>
              </div>
            )}

            {!!user.tags?.length && (
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-xs text-base-content/40 font-medium pl-0.5">Tags</span>
                <TagInput showLabel={false} tags={user.tags} />
              </div>
            )}
          </ProfileCard>
        )}

        {/* Preferences & Shared Media Card */}
        <ProfileCard title="Preferences & Media" variant="list">
          <NotificationToggle id={user.id} />
          <StarredMessages />
          <MediaSelection conversationId={userConversation?.id!} />
        </ProfileCard>

        {/* Groups in Common */}
        {!!commonGroups.length && (
          <div className="flex flex-col gap-2 px-4">
            <div className="flex items-center justify-between pl-1">
              <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                Groups in common
              </span>
              <span className="badge badge-sm bg-base-300 border-none text-base-content/70 font-semibold px-2 py-2 rounded-full">
                {commonGroups.length}
              </span>
            </div>
            <div className="bg-base-100/20 backdrop-blur-md rounded-2xl py-4 flex flex-col gap-1 shadow-xs">
              {commonGroups.map((group) => (
                <Group key={group.id} group={group!} />
              ))}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex flex-col gap-2.5 px-4 mt-auto pt-6">
          {showChatOption && (
            <button
              onClick={handleStartingConversation}
              className="btn btn-block bg-base-100  text-primary rounded-2xl font-bold py-3.5 shadow-sm pressable"
            >
              Chat
            </button>
          )}
          <button
            onClick={handleBlockingUser}
            className="btn btn-block bg-base-100  text-error rounded-2xl font-bold py-3.5 shadow-sm pressable"
          >
            {blockedConversation ? "Unblock" : "Block"} {user?.username}
          </button>
          {userConversation?.host === "user" && userConversation.active && (
            <button
              onClick={handleDeletingConversation}
              className="btn btn-block btn-error !text-[--black-white] rounded-2xl font-bold py-3.5 shadow-sm pressable"
            >
              Delete chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({ group }: { group: IGroupConversation }) {
  const profileTab = useStore((s) => s.profileTab);
  const { setSelectedConversation } = useConversationStore((s) => s.conversationActions);

  function handleSelectedGroup() {
    const setSelectedUser = useStore.getState().setSelectedUser;
    setSelectedConversation(group.id);
    setSelectedUser(null);
    profileTab.back();
  }

  return (
    <div
      onClick={handleSelectedGroup}
      className="hover:bg-[--hover-secondary] transition-colors duration-150 w-full flex items-center gap-4 px-5 py-3 cursor-pointer pressable"
    >
      <Avatar url={group.profilePicture} onlineIndication={false} size="40px" />
      <div className="flex flex-col justify-center pointer-events-none">
        <span className="font-semibold text-sm text-base-content">{group.displayName}</span>
      </div>
    </div>
  );
}

export default memo(UserProfile);
