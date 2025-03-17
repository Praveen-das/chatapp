"use client";
import React, { MouseEvent, memo, useCallback, useEffect, useState } from "react";
import { useMessageStore } from "../../../../../store/messageStore";
import moment from "moment";
import { useStore } from "../../../../../store/global";
import socket from "../../../../../lib/ws";
import Avatar from "../../../../ui/Avatar";
import { useConversationStore } from "../../../../../store/conversationStore";
import { IConversation } from "../../../../../interfaces/conversationInterface";
import { useMenu } from "store/menu";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { DisplayRecentMessage } from "./DisplayRecentMessage";
import { IUser } from "@interfaces/userInterface";
import { getReceiver } from "@lib/conversation";

interface IConve {
  conversation: IConversation;
  isSelected: boolean;
  lastSeen?: string;
}

function Conversation({ conversation, isSelected }: IConve): React.JSX.Element {
  const setSelectedConversation = useConversationStore((s) => s.setSelectedConversation);
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const setDeviceTab = useStore((s) => s.setDeviceTab);

  const handleSelectedConversation = useCallback(() => {
    setDeviceTab("chatarea");
    setSelectedConversation(conversation.id);
    setSelectedUser(null);
    toggleProfile(false);
    socket.selectedConversation = conversation;
  }, [conversation]);

  const recentMessage = conversation.recentMessage;
  const isUserConversation = conversation.host === "user";

  const receiver = isUserConversation ? getReceiver(conversation)! : null;

  const displayName = isUserConversation ? receiver?.username : conversation.displayName;

  return (
    <div onClick={handleSelectedConversation} className="flex">
      <div
        className={`group flex gap-4 items-center w-full max-sm:py-2 max-sm:pr-2 sm:px-4 sm:min-h-[75px] ${isSelected ? "sm:bg-base-200 text-white" : ""} rounded-2xl cursor-pointer`}
      >
        <RenderAvatar conversation={conversation} receiver={receiver} />
        <div className="min-w-0 w-full space-y-1">
          <div className="flex gap-4 justify-between items-center">
            <h1 className="text-sm truncate" title={displayName}>
              {displayName}
            </h1>
            {recentMessage && <RecentMessageTimestamp timestamp={recentMessage.timestamp} />}
          </div>
          <div className="flex justify-between items-center h-5 ">
            <DisplayRecentMessage recentMessage={recentMessage!} />
            <div className="flex items-center">
              <UnreadMessageCount conversation={conversation} isSelected={isSelected} />
              <DropdownMenu conversation={conversation} />
            </div>
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
  conversation,
  isSelected,
}: {
  conversation: IConversation;
  isSelected: boolean;
}): React.ReactNode {
  const unreadMessagesStore = useMessageStore((s) => s.unreadMessages);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let messagesCount = unreadMessagesStore.get(conversation.id)?.length || 0;
    if (isSelected) {
      setUnreadMessages(0);
    } else {
      setUnreadMessages(messagesCount);
    }
  }, [conversation,unreadMessagesStore, isSelected]);

  if (!unreadMessages) return null;

  return (
    <h1 className="flex justify-center items-center text-xs bg-primary text-white w-5 h-5 rounded-full duration-100 group-hover:opacity-0">
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
      className="btn btn-circle btn-ghost w-6 h-6 min-h-6 -mr-1 duration-100 opacity-0 group-hover:opacity-100"
    >
      <ChevronDownIcon className="size-5" />
    </div>
  );
}

function RenderAvatar({ conversation, receiver }: { conversation: IConversation; receiver?: IUser | null }) {
  if (conversation.host === "group") return <Avatar url={conversation.profilePicture} onlineIndication={false} />;

  if (!receiver) return <></>;

  const blockedConversation = conversation.blocked;

  const isOnline = receiver.status === "online";

  return (
    <Avatar
      url={receiver.profilePicture}
      profileHidden={!receiver.rules?.profilePicture.isVisible}
      online={!blockedConversation && isOnline}
    />
  );
}

export default memo(Conversation);
