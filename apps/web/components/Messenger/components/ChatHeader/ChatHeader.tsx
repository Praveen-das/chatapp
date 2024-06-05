"use client";
import { useSocket } from "../../../../context/SocketProvider";
import React, { useEffect } from "react";
import moment from "moment";
import { Popover } from "@headlessui/react";
import { useConversation, useMessages } from "../../../../store/messageStore";
import { useStore } from "../../../../store/global";
import { useAuth } from "../../../../context/AuthContext";

export default function ChatHeader() {
  const { user: _user } = useAuth()
  const { users, sendMessageDeleteRequest, blockedUsers, blockedByUsers, sendUserBlockRequest, sendUserUnBlockRequest } = useSocket();

  const selectedChats = useMessages(s => s.selectedChats)
  const setSelectedChats = useMessages(s => s.setSelectedChats)
  const clearChat = useMessages(s => s.clearChat)
  const deleteChat = useMessages(s => s.deleteChat)

  const setSelectedConversation = useStore(s => s.setSelectedConversation);
  const selectedConversation = useStore(s => s.selectedConversation);
  const selectedUser = useStore(s => s.selectedUser);
  const { messages } = useConversation();

  const conversationId = selectedConversation?.id!
  const receiver = users.find(s => !s.self && selectedConversation?.members.includes(s.userId)) || selectedUser
  const isBlockedUser = blockedUsers.some(u => u.blockedId === receiver?.userId!)
  const isBlockedByUser = blockedByUsers.some(u => u.userId === receiver?.userId!)

  const handleBlockingUser = () => {

    const req = {
      userId: _user?.id!,
      blockedId: receiver?.userId!,
      createtAt: Date.now()
    }

    if (isBlockedUser)
      sendUserUnBlockRequest(req)
    else sendUserBlockRequest(req)
  }

  const handleClearChat = () => {
    const _messages = messages.map(({ id }) => ({ id, deletedFor: _user?.id! }))

    sendMessageDeleteRequest({ conversationId, messages: _messages })
    clearChat(conversationId)
  }

  const options = [
    !!selectedChats.length &&
    { label: 'Clear Selection', handler: () => setSelectedChats(null) },
    { label: 'Close chat', handler: () => setSelectedConversation(null) },
    { label: 'Clear chat', handler: handleClearChat },
    receiver && { label: isBlockedUser ? 'Unblock' : 'Block', handler: handleBlockingUser },
    !receiver && { label: 'Exit group', handler: handleBlockingUser },
  ]

  const displayName = receiver?.username || (selectedConversation as IGroupConversation).displayName

  return (
    <>
      <div className="flex items-center gap-4 text-white px-4">
        <div className='size-12 bg-gray-700 rounded-full'></div>
        <div className="grid gap-1">
          <label className="text-sm" htmlFor="username">{displayName}</label>
          {
            receiver && !isBlockedByUser && !isBlockedUser &&
            <label className="text-xs" htmlFor="lastseen">
              {receiver?.connected ?
                'online' :
                moment(new Date((receiver?.lastSeen)!)).format('LT')}
            </label>
          }
        </div>

        <Popover as="div" className="relative inline-block text-left ml-auto">
          <Popover.Button className="btn btn-sm btn-circle btn-ghost outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
            </svg>
          </Popover.Button>
          <Popover.Panel className="grid absolute mt-2 right-2 z-10 whitespace-nowrap rounded-md p-1 bg-zinc-700 shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
            {
              options.map((option, i) => (
                option &&
                <Popover.Button
                  key={i}
                  onClick={option.handler}
                  className='btn btn-md h-10 min-h-10 btn-ghost justify-start'
                >
                  {option.label}
                </Popover.Button>
              ))
            }
          </Popover.Panel>
        </Popover>
      </div>
    </>
  );
}
