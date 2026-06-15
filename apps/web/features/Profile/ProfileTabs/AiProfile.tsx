"use client";

import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { memo } from "react";
import useSocket from "../../../context/SocketProvider";
import { useConversationStore } from "../../../store/conversationStore";
import { useStore } from "../../../store/global";
import { useMessageStore } from "../../../store/messageStore";
import Avatar from "../../ui/Avatar";
import MediaSelection from "./SharedComponents/MediaSelection";
import StarredMessages from "./SharedComponents/StarredMessages";
import { APP_NAME } from "config/constants";
import NotificationToggle from "./SharedComponents/NotificationToggle";
import useAuth from "@hooks/useAuth";
import { SparkSolid } from "iconoir-react";
import { ProfileHeader, ProfileCard } from "./SharedComponents/ProfileLayouts";

function AiProfile() {
  const { user } = useAuth();
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

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <ProfileHeader title="AI info" onBack={closeProfile} />

      {/* Profile details */}
      <div className="flex-1 flex relative gap-6 pt-4 text-sm flex-col overflow-y-auto pb-10 no-scrollbar">
        {/* Profile Card */}
        <div className="flex gap-6 items-center px-4 py-4 border-b border-base-content/5">
          <div className="flex items-center justify-center w-[80px] h-[80px] bg-primary/10 text-primary rounded-full shrink-0">
            <SparkSolid className="size-9" />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-lg font-bold text-base-content truncate">AI Assistant</span>
            <span className="text-xs text-base-content/50">Powered by Google Gemini</span>
          </div>
        </div>

        {/* AI Details Card */}
        <ProfileCard title="Description">
          <p className="text-sm text-base-content/80 leading-relaxed">
            I am your AI assistant, here to help you with your queries, brainstorming, coding, and general tasks.
          </p>
        </ProfileCard>

        {/* Preferences Card */}
        <ProfileCard title="Preferences" variant="list">
          <StarredMessages />
        </ProfileCard>
      </div>
    </div>
  );
}

export default memo(AiProfile);
