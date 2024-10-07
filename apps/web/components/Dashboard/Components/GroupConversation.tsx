"use client";
import React, { memo, useCallback, useEffect, useState } from "react";
import { useMessageStore } from "../../../store/messageStore";
import moment from "moment";
import { useStore } from "../../../store/global";
import socket from "../../../lib/ws";
import { Avatar } from "./Avatar";
import { useConversationStore } from "../../../store/conversationStore";
import { IGroupConversation } from "../../../interfaces/conversationInterface";


interface IGroupProps {
  conversation: IGroupConversation
  isSelectedGroup?: boolean
}

function GroupConversation({ conversation, isSelectedGroup }: IGroupProps): React.JSX.Element {
  const unreadMessagesStore = useMessageStore(s => s.unreadMessages);
  const [unreadMessages, setUnreadMessages] = useState(0)
  const setSelectedConversation = useConversationStore(s => s.setSelectedConversation);
  const setSelectedUser = useStore(s => s.setSelectedUser);
  const toggleProfile = useStore(s => s.toggleProfile);
  const recentMessages = useMessageStore((s) => s.recentMessage)
  const recentMessagePayload = recentMessages.get(conversation.id);
  
  const handleSelectedConversation = useCallback(() => {
    setSelectedConversation(conversation.id)
    setSelectedUser(null)
    toggleProfile(false)
    socket.selectedConversation = conversation;
  }, [conversation]);

  useEffect(() => {
    let _unreadMessages = unreadMessagesStore.get(conversation.id!)?.length || 0;

    if (isSelectedGroup) {
      setUnreadMessages(0)
    } else {
      setUnreadMessages(_unreadMessages)
    }

  }, [unreadMessagesStore, isSelectedGroup])
  
  console.log(recentMessagePayload)
  
  const recentMessageSender = conversation.members.find(m => m.id === recentMessagePayload?.from)?.username
  const recentMessage = recentMessageSender + ':' + recentMessagePayload?.message
  
  return (
    <div onClick={handleSelectedConversation} className="flex">
      <div
        className={`group flex gap-6 px-4 items-center w-full min-h-[75px] ${isSelectedGroup ? "bg-primary text-white" : ""}  rounded-2xl cursor-pointer`}
      >
        <Avatar url={conversation.profilePicture} onlineIndication={false} />
        <div className="min-w-0 w-full">
          <div className="flex gap-4 justify-between items-center">
            <h1 className="text-sm truncate">
              {conversation.displayName}
            </h1>
            {
              recentMessagePayload &&
              <label className='text-sm whitespace-nowrap' htmlFor="">{moment(new Date(recentMessagePayload?.timestamp!)).format('LT')}</label>
            }
          </div>
          {
            recentMessagePayload &&
            <div className="flex justify-between items-center h-5 ">
              <h1 className="text-sm truncate w-2/3">
                {recentMessage}
              </h1>
              <div className="flex items-center duration-100 group-hover:translate-x-0 translate-x-5">
                {
                  unreadMessages > 0 &&
                  <h1 className="flex justify-center items-center text-xs bg-primary w-5 h-5 rounded-full duration-100 group-hover:opacity-0">
                    {unreadMessages}
                  </h1>
                }
                <button className="btn btn-circle btn-ghost w-6 h-6 min-h-6 -mr-1 duration-100 opacity-0 group-hover:opacity-100">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          }
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
    </div >
  );
}

export default memo(GroupConversation)
