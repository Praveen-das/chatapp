"use client";
import React, { MouseEvent, memo, useCallback } from "react";
import { useMessageStore } from "../../../../../store/messageStore";
import moment from "moment";
import { useStore } from "../../../../../store/global";
import socket from "../../../../../lib/ws";
import { useConversationStore } from "../../../../../store/conversationStore";
import { IConversation } from "@repo/interfaces/conversationInterface";
import { useMenu } from "store/menu";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { DisplayRecentMessage } from "./DisplayRecentMessage";
import { getDisplayName, getReceiverMetadata, getUserFromMetadata } from "@lib/conversation";
import classNames from "classnames";
import { useTheme } from "@hooks/useTheme";
import { RenderAvatar } from "./RenderAvatar";
import { useAttachments } from "store/attachments";

interface IConve {
  conversation: IConversation;
  isSelected: boolean;
  lastSeen?: string;
}

function Conversation({ conversation, isSelected }: IConve): React.JSX.Element {
  const { isDarkMode, isLightMode } = useTheme();
  const { setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const setDeviceTab = useStore((s) => s.setDeviceTab);
  const clearImages = useAttachments((s) => s.clearImages);

  const handleSelectedConversation = useCallback(() => {
    setDeviceTab("chatarea");
    setSelectedConversation(conversation.id);
    setSelectedUser(null);
    toggleProfile(false);
    clearImages();
    socket.selectedConversation = conversation;
  }, [conversation]);

  const recentMessage = conversation.recentMessage;
  const isUserConversation = conversation.host === "user";
  const receiver = isUserConversation ? getReceiverMetadata(conversation)! : null;
  const displayName = getDisplayName(conversation);
  
  const class_selected = classNames({
    "sm:bg-base-200": isDarkMode && isSelected,
    "sm:bg-primary text-white [--avatarBg:oklch(1_0_0_/_0.20)]": isLightMode && isSelected,
  });
  
  return (
    <div
      onClick={handleSelectedConversation}
      className={`group flex gap-4 items-center w-full max-sm:py-2 max-sm:pr-2 sm:px-4 sm:min-h-[75px] rounded-2xl cursor-pointer bg-[--l-base-300] z-10 ${class_selected}`}
    >
      <RenderAvatar conversation={conversation} receiver={getUserFromMetadata(receiver!)} />
      <div className="min-w-0 w-full space-y-1">
        <div className="flex gap-4 justify-between items-center">
          <h1 className="text-sm truncate" title={displayName}>
            {displayName}
          </h1>
          {recentMessage && <RecentMessageTimestamp timestamp={recentMessage.timestamp} />}
        </div>
        <div className="flex justify-between items-center h-5 ">
          <DisplayRecentMessage recentMessage={recentMessage!} />
          <div className="flex items-center relative">
            <UnreadMessageCount conversationId={conversation.id} isSelected={isSelected} />
            <DropdownMenu conversation={conversation} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentMessageTimestamp({ timestamp }: { timestamp: number }): React.ReactNode {
  return (
    <label className="text-xs whitespace-nowrap" htmlFor="">
      {moment(new Date(timestamp)).format("LT")}
    </label>
  );
}

function UnreadMessageCount({
  conversationId,
  isSelected,
}: {
  conversationId: string;
  isSelected: boolean;
}): React.ReactNode {
  const unreadMessagesStore = useMessageStore((s) => s.unreadMessages);
  let unreadMessages = (!isSelected && unreadMessagesStore.get(conversationId)?.length) || 0;

  if (!unreadMessages) return null;

  return (
    <h1 className="absolute right-0 flex justify-center items-center text-xs bg-primary text-white w-5 h-5 rounded-full duration-100 opacity-100 translate-x-0 group-hover:opacity-0 group-hover:-translate-x-4">
      {unreadMessages}
    </h1>
  );
}

function DropdownMenu({ conversation }: { conversation: IConversation }) {
  const setMenu = useMenu((s) => s.setMenu);

  const handleOpeningMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setMenu({ data: conversation, reference: e, id: "conversation" });
  };

  return (
    <div
      onClick={handleOpeningMenu}
      tabIndex={0}
      className="absolute right-0 btn btn-circle btn-ghost w-6 h-6 min-h-6 -mr-1 duration-100 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0"
    >
      <ChevronDownIcon className="size-5" />
    </div>
  );
}

export default memo(Conversation);
