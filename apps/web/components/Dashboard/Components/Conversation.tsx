"use client";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useMessageStore } from "../../../store/messageStore";
import moment from "moment";
import useSocket from "../../../context/SocketProvider";
import { useStore } from "../../../store/global";
import socket from "../../../lib/ws";
import { Avatar } from "./Avatar";
import useAuth from "../../../hooks/useAuth";
import { useConversationStore } from "../../../store/conversationStore";
import { IUserConversation } from "../../../interfaces/conversationInterface";

interface IConve {
  conversation: IUserConversation;
  isSelected?: boolean;
  lastSeen?: string;
}

function Conversation({ conversation, isSelected }: IConve): React.JSX.Element {
  const { user: currentUser } = useAuth();
  const { blockedUsers } = useSocket();
  const users = useStore((s) => s.users);
  const unreadMessagesStore = useMessageStore((s) => s.unreadMessages);
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const recentMessages = useMessageStore((s) => s.recentMessage)
  const recentMessage = recentMessages.get(conversation.id);

  const handleSelectedConversation = useCallback(() => {
    setSelectedConversation(conversation.id);
    setSelectedUser(null);
    toggleProfile(false);
    socket.selectedConversation = conversation;
  }, [conversation]);

  const [unreadMessages, setUnreadMessages] = useState(0);

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

  const receiver = users.find((connectedUser) => connectedUser.id === member?.id);

  if (!receiver) return <></>;

  const blockedUser = blockedUsers.some(
    (u) => u.blockedUser.id === receiver.id || u.user.id === receiver.id
  );

  const isOnline = receiver.status === "online";

  return (
    <div onClick={handleSelectedConversation} className="flex">
      <div
        className={`group flex gap-6 px-4 items-center w-full min-h-[75px] ${isSelected ? "bg-primary text-white" : ""} rounded-2xl cursor-pointer`}
      >
        <Avatar
          url={receiver.profilePicture}
          profileHidden={!receiver.rules?.profilePicture.isVisible}
          online={(!blockedUser) && isOnline}
        />
        <div className="min-w-0 w-full">
          <div className="flex gap-4 justify-between items-center">
            <h1 className="text-sm truncate">
              {receiver.username}
            </h1>
            {recentMessage && (
              <label className="text-xs whitespace-nowrap" htmlFor="">
                {moment(new Date(recentMessage?.timestamp!)).format("LT")}
              </label>
            )}
          </div>
          {recentMessage && (
            <div className="flex justify-between items-center h-5 ">
              <div className="flex items-center gap-2 text-sm font-light w-3/4 ">
                {recentMessage?.attachment?.type === "images" ? (
                  <>
                    <div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="size-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm13.5 3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="truncate">
                      {recentMessage?.message || "Image"}
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
                    <div className="truncate">
                      {recentMessage?.message || "Link"}
                    </div>
                  </>
                ) : (
                  <div className="truncate">{recentMessage?.message}</div>
                )}
              </div>
              <div className="flex items-center duration-100 group-hover:translate-x-0 translate-x-5">
                {unreadMessages > 0 && (
                  <h1 className="flex justify-center items-center text-xs bg-primary text-white w-5 h-5 rounded-full duration-100 group-hover:opacity-0">
                    {unreadMessages}
                  </h1>
                )}
                <button className="btn btn-circle btn-ghost w-6 h-6 min-h-6 -mr-1 duration-100 opacity-0 group-hover:opacity-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className=''>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </Menu.Button>

        <Menu.Items className="absolute right-0 z-10 whitespace-nowrap origin-top-right rounded-md py-1 bg-white shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden focus:outline-none">
          {links.map((link, i) => (
            <Menu.Item key={i}>
              {({ active }) => (
                <a
                  href="#"
                  className={`${active ? 'text-primary' : 'text-gray-700'} flex gap-3 items-center rounded-md px-4 py-2 text-sm`}>
                  {link.label}
                </a>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Menu> */}
    </div>
  );
}

export default memo(Conversation);
