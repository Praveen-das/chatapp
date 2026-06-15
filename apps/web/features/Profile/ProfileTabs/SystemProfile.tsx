"use client";

import { memo } from "react";
import useSocket from "../../../context/SocketProvider";
import { IGroupConversation } from "@repo/interfaces/conversationInterface";
import { useConversationStore } from "../../../store/conversationStore";
import { useStore } from "../../../store/global";
import { useMessageStore } from "../../../store/messageStore";
import Avatar from "../../ui/Avatar";
import MediaSelection from "./SharedComponents/MediaSelection";
import StarredMessages from "./SharedComponents/StarredMessages";
import { APP_NAME } from "config/constants";
import { ProfileHeader, ProfileCard } from "./SharedComponents/ProfileLayouts";

function SystemProfile() {
  const { sendConversationDeleteRequest } = useSocket();

  const setModal = useStore((s) => s.setModal);
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const { updateConversation, setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const conversation = useConversationStore((s) => s.selectedConversation);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const profileTab = useStore((s) => s.profileTab);
  const setDeviceTab = useStore((s) => s.setDeviceTab);
  const clearChat = useMessageStore((s) => s.clearChat);

  function closeProfile() {
    profileTab.back();
    useConversationStore.getState().selectedConversation && setSelectedUser(null);
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

  function openViewProfilePictureModal() {
    setModal({
      activeModal: "viewProfilePictureModal",
      state: {
        url: "/favicon.svg",
        displayName: APP_NAME,
      },
      open: true,
    });
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <ProfileHeader title="Chat info" onBack={closeProfile} />

      {/* Profile details */}
      <div className="flex-1 flex relative gap-6 pt-4 text-sm flex-col overflow-y-auto pb-10 no-scrollbar">
        {/* Profile Card */}
        <div className="flex gap-6 items-center px-4 py-4 border-b border-base-content/5">
          <Avatar url={"/favicon.svg"} size="80px" onlineIndication={false} onClick={openViewProfilePictureModal} />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-lg font-bold text-base-content truncate">{APP_NAME}</span>
            <span className="text-xs text-base-content/50">System notification</span>
          </div>
        </div>

        {/* Preferences & Shared Media Card */}
        <ProfileCard title="Preferences & Media" variant="list">
          <StarredMessages />
          <MediaSelection conversationId={conversation?.id!} />
        </ProfileCard>

        {/* Actions Footer */}
        <div className="flex flex-col gap-2.5 px-4 mt-auto pt-6">
          {conversation?.host !== "group" && conversation?.active && (
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

export default memo(SystemProfile);
