"use client";

import TagInput from "@features/ui/TagInput";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { PropsWithChildren, memo, useCallback } from "react";
import useSocket from "../../../context/SocketProvider";
import { IConversation, IGroupConversation, IUserConversation } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { useConversationStore } from "../../../store/conversationStore";
import { useStore } from "../../../store/global";
import { useMessageStore } from "../../../store/messageStore";
import Avatar from "../../ui/Avatar";
import MediaSelection from "./SharedComponents/MediaSelection";
import StarredMessages from "./SharedComponents/StarredMessages";
import useConversation from "@hooks/useConversation";
import { APP_NAME } from "config/constants";

function SystemProfile() {
  const { sendConversationDeleteRequest } = useSocket();

  const setModal = useStore((s) => s.setModal);
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const { updateConversation, setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const conversation = useConversationStore(s=>s.selectedConversation)
  const toggleProfile = useStore((s) => s.toggleProfile);
  const profileTab = useStore((s) => s.profileTab);
  const setDeviceTab = useStore((s) => s.setDeviceTab);
  const clearChat = useMessageStore((s) => s.clearChat);
  const { startConversation } = useConversation();

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
          <Avatar url={"/favicon.svg"} size="70px" onlineIndication={false} onClick={openViewProfilePictureModal} />
          <div className="flex flex-col gap-2">
            <label className="text-base text-base-content" htmlFor="">
              {APP_NAME}
            </label>
            <div className="-ml-1">System notification</div>
          </div>
        </div>

        <div className="space-y-1 divide-y-[1.75px] divide-[--base-300-400] max-sm:mt-2 sm:mt-4 max-sm:px-4 px-8 [&>div]:h-16">
          <StarredMessages conversationId={conversation?.id!} />
          <MediaSelection conversationId={conversation?.id!} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto max-sm:px-4 px-8">
          {conversation?.host !== "group" && conversation?.active && (
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

export default memo(SystemProfile);
