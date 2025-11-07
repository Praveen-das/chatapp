"use client";

import TagInput from "@features/ui/TagInput";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import useConversation from "@hooks/useConversation";
import { IConversation, IGroupConversation, IUserConversation } from "@repo/interfaces/conversationInterface";
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
import { getMemberById } from "@lib/conversation";

function UserProfile({ user, showChatOption = false }: { user: IUser; showChatOption?: boolean }) {
  const { sendUserBlockRequest, sendUserUnBlockRequest, sendConversationDeleteRequest } = useSocket();

  const setModal = useStore((s) => s.setModal);
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const conversations = useConversationStore((s) => s.conversations);
  const { updateConversation, setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const userConversation = conversations.find(
    (c) => c.host === "user" && getMemberById(c, user.id)
  ) as IUserConversation;
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
      return c.host === "group" && c.members.some((m) => m.id === user.id);
    },
    [user]
  );

  const commonGroups = useConversationStore.getState().conversations.filter(isCommonGroup);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="min-h-16 w-full flex items-center max-sm:gap-2 gap-4 max-sm:px-2 px-4">
        <button onClick={closeProfile} className={`btn btn-sm btn-ghost btn-circle`}>
          <ChevronRightIcon className="size-5" />
        </button>
        <label htmlFor="contact info">Chat info</label>
      </div>

      {/* Profile details */}
      <div className="flex h-full gap-8 max-sm:pt-2 pt-4 text-sm flex-col overflow-y-scroll max-sm:pb-3 pb-10 no-scrollbar">
        {/* profile */}
        <div className="flex gap-8 items-center max-sm:px-4 px-8">
          <Avatar
            url={user.profilePicture}
            profileHidden={Boolean(user.rules?.includes("hide_profilepicture"))}
            size="70px"
            onlineIndication={false}
            onClick={openViewProfilePictureModal}
          />
          <div className="flex flex-col gap-2">
            <label className="text-base text-base-content" htmlFor="">
              {user?.username}
            </label>
            <div className="-ml-1">{user?.phoneNumber}</div>
          </div>
        </div>

        {/* about */}
        {user.bio && !user?.rules?.includes("hide_bio") && (
          <div className="w-full flex flex-col max-sm:px-4 px-8">
            <p className="leading-7">{user.bio}</p>
          </div>
        )}

        {/* Tags */}
        {!!user.tags?.length && (
          <div className="max-sm:px-4 px-8">
            <TagInput showLabel={false} tags={user.tags} />
          </div>
        )}

        <div className="space-y-1 divide-y-[1.75px] divide-[--base-300-400] max-sm:mt-2 sm:mt-4 max-sm:px-4 px-8 [&>div]:h-16">
          <NotificationToggle id={user.id} />
          <StarredMessages conversationId={userConversation?.id!} />
          <MediaSelection conversationId={userConversation?.id!} />
        </div>

        {/* Groups */}
        {!!commonGroups.length && (
          <div className="w-full flex flex-col">
            <div className="flex gap-4 max-sm:px-4 px-8">
              <label className="text-sm text-primary mb-2 " htmlFor="">
                Groups in common
              </label>
              {commonGroups.length}
            </div>
            {commonGroups.map((group) => (
              <Group key={group.id} group={group!} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto max-sm:px-4 px-8">
          {showChatOption && (
            <div onClick={handleStartingConversation} tabIndex={0} className="btn btn-block bg-base-100 text-error">
              Chat
            </div>
          )}
          <div onClick={handleBlockingUser} tabIndex={0} className="btn btn-block bg-base-100 text-error">
            {blockedConversation ? "Unblock" : "Block"} {user?.username}
          </div>
          {userConversation?.host === "user" && userConversation.active && (
            <div
              onClick={handleDeletingConversation}
              tabIndex={0}
              className="btn btn-block btn-error !text-[--black-white]"
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
      className="hover:bg-[--hover-secondary] w-full flex items-center gap-4 max-sm:px-4 px-8 py-3 cursor-pointer"
    >
      <Avatar url={group.profilePicture} onlineIndication={false} size="40px" />
      <div className="flex flex-col justify-center pointer-events-none">
        <label htmlFor="">{group.displayName}</label>
      </div>
    </div>
  );
}

export default memo(UserProfile);
