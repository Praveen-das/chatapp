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
  const { isLightMode } = useTheme();
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

  return (
    <div
      onClick={handleSelectedConversation}
      role="button"
      tabIndex={0}
      className={`group relative flex gap-4 items-center w-full max-sm:py-2 max-sm:pr-2 sm:px-4 sm:min-h-[75px] rounded-2xl cursor-pointer z-10 transition-all duration-150 outline-none ${
        isSelected
          ? isLightMode
            ? "bg-transparent hover:bg-base-content/[0.03] sm:bg-primary/85 sm:text-white sm:[--avatarBg:oklch(1_0_0/0.20)] sm:shadow-[0_4px_12px_rgba(var(--p),0.2)] sm:hover:bg-primary/85"
            : "bg-transparent hover:bg-base-content/[0.03] sm:bg-base-content/[0.06] sm:shadow-[inset_0_0_0_1px_oklch(var(--bc)/0.05)] sm:hover:bg-base-content/[0.06]"
          : "bg-transparent hover:bg-base-content/[0.03]"
      }`}
    >
      <RenderAvatar conversation={conversation} receiver={getUserFromMetadata(receiver!)} />
      <div className="min-w-0 w-full space-y-1">
        <div className="flex gap-4 justify-between items-center">
          <h2 className="text-[14px] font-medium opacity-90 truncate text-current" title={displayName}>
            {displayName}
          </h2>
          {recentMessage && <RecentMessageTimestamp timestamp={recentMessage.timestamp} />}
        </div>
        <div className="flex justify-between items-center h-5 ">
          <DisplayRecentMessage recentMessage={recentMessage!} host={conversation.host} />
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
    <span className="text-[11px] font-medium opacity-50 whitespace-nowrap text-current">
      {moment(new Date(timestamp)).format("LT")}
    </span>
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
    <span className="absolute right-0 flex justify-center items-center text-xs font-semibold bg-primary text-primary-content w-5 h-5 rounded-full transition-all duration-200 ease-out opacity-100 translate-x-0 group-hover:opacity-0 group-hover:scale-90">
      {unreadMessages}
    </span>
  );
}

function DropdownMenu({ conversation }: { conversation: IConversation }) {
  const setMenu = useMenu((s) => s.setMenu);
  const menu = useMenu((s) => s.menu);
  const isOpen = menu?.id === "conversation" && menu?.data?.id === conversation.id;

  const handleOpeningMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setMenu({ data: conversation, reference: e, id: "conversation" });
  };

  return (
    <div
      onClick={handleOpeningMenu}
      tabIndex={0}
      role="button"
      className={`absolute right-0 btn btn-circle btn-ghost backdrop-blur-md border border-base-content/5 w-6 h-6 min-h-6 -mr-1 flex justify-center items-center transition-all duration-200 ease-out outline-none text-current ${
        isOpen ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-90 translate-x-2"
      } group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0`}
    >
      <ChevronDownIcon className="size-4 text-current opacity-60" />
    </div>
  );
}

export default memo(Conversation);
