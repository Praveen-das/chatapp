"use client";
import React, { MouseEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useMessageStore } from "../../../../../store/messageStore";
import moment from "moment";
import { useStore } from "../../../../../store/global";
import socket from "../../../../../lib/ws";
import Avatar from "../../../../ui/Avatar";
import { useConversationStore } from "../../../../../store/conversationStore";
import { IGroupConversation } from "@repo/interfaces/conversationInterface";
import { useMenu } from "store/menu";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { DisplayRecentMessage } from "./DisplayRecentMessage";
import useAuth from "@hooks/useAuth";

interface IGroupProps {
  conversation: IGroupConversation;
  isSelectedGroup?: boolean;
}

function GroupConversation({ conversation, isSelectedGroup }: IGroupProps): React.JSX.Element {
  const { user } = useAuth();
  const unreadMessagesStore = useMessageStore((s) => s.unreadMessages);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const setDeviceTab = useStore((s) => s.setDeviceTab);
  const setMenu = useMenu((s) => s.setMenu);

  const handleSelectedConversation = useCallback(() => {
    setDeviceTab("chatarea");
    setSelectedConversation(conversation.id);
    setSelectedUser(null);
    toggleProfile(false);
    socket.selectedConversation = conversation;
  }, [conversation]);

  useEffect(() => {
    let _unreadMessages = unreadMessagesStore.get(conversation.conversationId!)?.length || 0;

    if (isSelectedGroup) {
      setUnreadMessages(0);
    } else {
      setUnreadMessages(_unreadMessages);
    }
  }, [unreadMessagesStore, isSelectedGroup]);

  const recentMessage = conversation.recentMessage;

  const handleOpeningMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setMenu({
      data: conversation,
      reference: e.currentTarget,
      id: "conversation",
    });
  };

  ///////////////////////////////////////////

  const from = conversation.members.find((m) => m.id === recentMessage?.from)!;

  const sender = from.id === user?.id ? "You" : from.username;

  return (
    <div onClick={handleSelectedConversation} className="flex">
      <div
        className={`group flex gap-4 items-center w-full max-sm:pr-2 sm:px-4 min-h-[75px] ${isSelectedGroup ? "sm:bg-base-200 text-white" : ""}  rounded-2xl cursor-pointer`}
      >
        <Avatar url={conversation.profilePicture} onlineIndication={false} />
        <div className="min-w-0 w-full">
          <div className="flex gap-4 justify-between items-center">
            <h1 className="text-sm truncate">{conversation.displayName}</h1>
            {recentMessage && (
              <label className="text-xs whitespace-nowrap" htmlFor="">
                {moment(new Date(recentMessage?.timestamp!)).format("LT")}
              </label>
            )}
          </div>
          <div className="flex justify-between items-center h-5 ">
            <DisplayRecentMessage recentMessage={conversation.recentMessage!} sender={sender} />
            <div className="flex items-center duration-100">
              {unreadMessages > 0 && (
                <h1 className="flex justify-center items-center text-xs bg-primary w-5 h-5 rounded-full duration-100 group-hover:opacity-0">
                  {unreadMessages}
                </h1>
              )}
              <span
                onClick={handleOpeningMenu}
                tabIndex={0}
                className="btn btn-circle btn-ghost w-6 h-6 min-h-6 -mr-1 duration-100 opacity-0 group-hover:opacity-100"
              >
                <ChevronDownIcon className="size-5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(GroupConversation);
