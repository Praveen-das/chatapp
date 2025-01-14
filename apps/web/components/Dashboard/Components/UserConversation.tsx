"use client";
import React, {
  MouseEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMessageStore } from "../../../store/messageStore";
import moment from "moment";
import useSocket from "../../../context/SocketProvider";
import { useStore } from "../../../store/global";
import socket from "../../../lib/ws";
import Avatar from "../../ui/Avatar";
import useAuth from "../../../hooks/useAuth";
import { useConversationStore } from "../../../store/conversationStore";
import { IUserConversation } from "../../../interfaces/conversationInterface";
import { useMenu } from "store/menu";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { CameraIcon } from "@heroicons/react/16/solid";
import { decrypt } from "@lib/e2e";

interface IConve {
  conversation: IUserConversation;
  isSelected: boolean;
  lastSeen?: string;
}

function UserConversation({ conversation, isSelected }: IConve): React.JSX.Element {
  const { user: currentUser } = useAuth();
  const unreadMessagesStore = useMessageStore((s) => s.unreadMessages);
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const setDeviceTab = useStore((s) => s.setDeviceTab);
  const setMenu = useMenu((s) => s.setMenu);

  const [unreadMessages, setUnreadMessages] = useState(0);
  const recentMessage = conversation.recentMessage;
  const messageString = recentMessage?.message
    ? decrypt(recentMessage.message)
    : null;

  const handleSelectedConversation = useCallback(() => {
    setDeviceTab("chatarea");
    setSelectedConversation(conversation.id);
    setSelectedUser(null);
    toggleProfile(false);
    socket.selectedConversation = conversation;
  }, [conversation]);

  useEffect(() => {
    let _unreadMessages = unreadMessagesStore.get(conversation.id)?.length || 0;

    if (isSelected) {
      setUnreadMessages(0);
    } else {
      setUnreadMessages(_unreadMessages);
    }
  }, [unreadMessagesStore, isSelected]);

  const member = conversation.members.find(
    (member) => member.id !== currentUser?.id
  );

  const receiver = conversation.members.find(
    (connectedUser) => connectedUser.id === member?.id
  );

  if (!receiver) return <></>;

  const blockedConversation = conversation.blocked;

  const isOnline = receiver.status === "online";

  const handleOpeningMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setMenu({
      data: conversation,
      reference: e.currentTarget,
      id: "conversation",
    });
  };

  return (
    <div onClick={handleSelectedConversation} className="flex">
      <div
        className={`group flex gap-4 items-center w-full max-sm:py-2 max-sm:pr-2 sm:px-4 sm:min-h-[75px] ${isSelected ? "sm:bg-base-200 text-white" : ""} rounded-2xl cursor-pointer`}
      >
        <Avatar
          url={receiver.profilePicture}
          profileHidden={!receiver.rules?.profilePicture.isVisible}
          online={!blockedConversation && isOnline}
        />
        <div className="min-w-0 w-full">
          <div className="flex gap-4 justify-between items-center">
            <h1 className="text-sm truncate">{receiver.username}</h1>
            {recentMessage && (
              <label className="text-xs whitespace-nowrap" htmlFor="">
                {moment(new Date(recentMessage?.timestamp!)).format("LT")}
              </label>
            )}
          </div>
          <div className="flex justify-between items-center h-5 ">
            {recentMessage ? (
              recentMessage.deleted ? (
                <div className="text-sm">This message is deleted</div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-light w-3/4 ">
                  {recentMessage?.attachment?.type === "images" ? (
                    <>
                      <div>
                        <CameraIcon className="size-4" />
                      </div>
                      <div className="truncate whitespace-pre-wrap line-clamp-1">
                        {messageString || "Image"}
                      </div>
                    </>
                  ) : recentMessage?.attachment?.type === "link" ? (
                    <>
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                          <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                        </svg>
                      </div>
                      <div className="truncate">{messageString || "Link"}</div>
                    </>
                  ) : (
                    <div className="truncate whitespace-pre-wrap line-clamp-1">
                      {messageString}
                    </div>
                  )}
                </div>
              )
            ) : (
              <span></span>
            )}
            <div className="flex items-center">
              {unreadMessages > 0 && (
                <h1 className="flex justify-center items-center text-xs bg-primary text-white w-5 h-5 rounded-full duration-100 group-hover:opacity-0">
                  {unreadMessages}
                </h1>
              )}
              <div
                onClick={handleOpeningMenu}
                tabIndex={0}
                className="btn btn-circle btn-ghost w-6 h-6 min-h-6 -mr-1 duration-100 opacity-0 group-hover:opacity-100"
              >
                <ChevronDownIcon className="size-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(UserConversation);
