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
      <div className="min-h-16 w-full flex items-center max-sm:gap-2 gap-4 max-sm:px-2 px-4">
        <button onClick={closeProfile} className={`btn btn-sm btn-ghost btn-circle`}>
          <ChevronRightIcon className="size-5" />
        </button>
        <label htmlFor="contact info">AI info</label>
      </div>

      {/* Profile details */}
      <div className="flex h-full gap-8 max-sm:pt-2 pt-4 text-sm flex-col overflow-y-scroll max-sm:pb-3 pb-10 no-scrollbar">
        {/* profile */}
        <div className="flex gap-8 items-center max-sm:px-4 px-8">
          <div className="avatar">
            <SparkSolid className="size-14" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-base text-base-content" htmlFor="">
              {"AI Assistant"}
            </label>
            <div className="-ml-1">Powered by Google Gemini</div>
          </div>
        </div>

        {/* about */}
        <div className="w-full flex flex-col max-sm:px-4 px-8">
          <p className="leading-7">I am your AI assistant, here to help you with your queries and tasks.</p>
        </div>

        <div className="space-y-1 divide-y-[1.75px] divide-[--base-300-400] max-sm:mt-2 sm:mt-4 max-sm:px-4 px-8 [&>div]:h-16">
          <StarredMessages />
          {/* <MediaSelection conversationId={conversation?.id!} /> */}
        </div>
      </div>
    </div>
  );
}

export default memo(AiProfile);
