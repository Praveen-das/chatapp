"use client";
import useSocket from "../../../../context/SocketProvider";
import React, { MouseEvent, useEffect } from "react";
import moment from "moment";
import { Popover } from "@headlessui/react";
import { useMessagesByConversation, useMessageStore } from "../../../../store/messageStore";
import { useStore } from "../../../../store/global";
import useAuth from "../../../../hooks/useAuth";
import { Avatar } from "../../../Dashboard/Components/Avatar";
import { useConversationStore } from "../../../../store/conversationStore";
import useSelectedConversation from "../../../../hooks/useSelectedConversation";

export default function ChatHeader({ showMenu = true }) {
  const { user: _user } = useAuth()
  const users = useStore(s => s.users)
  const { sendMessageDeleteRequest, blockedUsers, blockedByUsers, sendUserBlockRequest, sendUserUnBlockRequest } = useSocket();

  const selectedChats = useMessageStore(s => s.selectedChats)
  const setSelectedChats = useMessageStore(s => s.setSelectedChats)
  const clearChat = useMessageStore(s => s.clearChat)
  const deleteChat = useMessageStore(s => s.deleteChat)

  const setSelectedConversation = useConversationStore(s => s.setSelectedConversation);
  const selectedConversation = useSelectedConversation();
  const selectedUser = useStore(s => s.selectedUser);
  const setSelectedUser = useStore(s => s.setSelectedUser);
  const toggleProfile = useStore(s => s.toggleProfile)
  const { messages } = useMessagesByConversation();

  const conversationId = selectedConversation?.id!
  const receiver = users.find(s => !s.self && selectedConversation?.members.find(m => m.id === s.id)) || selectedUser
  const isBlockedUser = blockedUsers.some(u => u.blockedId === receiver?.id!)
  const isBlockedByUser = blockedByUsers.some(u => u?.userId === receiver?.id!)

  const handleBlockingUser = () => {

    const req = {
      userId: _user?.id!,
      blockedId: receiver?.id!,
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
    {
      label: 'Close chat', handler: (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        toggleProfile(false)
        setSelectedUser(null)
        setSelectedConversation(null)
      }
    },
    { label: 'Clear chat', handler: handleClearChat },
    receiver && { label: isBlockedUser ? 'Unblock' : 'Block', handler: handleBlockingUser },
    !receiver && { label: 'Exit group', handler: handleBlockingUser },
  ]

  function openProfile() {
    toggleProfile(true)
  }

  const isOnline = receiver?.status === 'online'
  const isGroup = selectedConversation?.host === 'group'
  const isHidden = !receiver?.rules?.profilePicture.isVisible

  const displayName = isGroup ? (selectedConversation as IGroupConversation)?.displayName : receiver?.username

  return (
    <>
      <div onClick={openProfile} className="min-h-16 flex items-center  gap-4 px-4">
        <div className='w-full flex items-center gap-4 cursor-pointer'>
          <Avatar profileHidden={!isGroup && isHidden} size='45px' onlineIndication={false} />
          <div className="grid gap-1">
            <label htmlFor="username">{displayName}</label>
            {
              !isGroup ?
                receiver &&
                (isOnline || receiver.rules?.lastSeen.isVisible) &&
                !isBlockedByUser &&
                !isBlockedUser &&
                <label className="text-xs" htmlFor="lastseen">
                  {isOnline ? 'online' : moment(new Date((receiver.lastSeen)!)).format('LT')}
                </label> :
                <label className="text-xs pointer-events-none whitespace-nowrap truncate" htmlFor="members">
                  {selectedConversation.members.map((m, i, a) => i !== a.length - 1 ? m.username + ', ' : m.username)}
                </label>
            }
          </div>
        </div>
        {
          showMenu &&
          <Popover as="div" className="relative inline-block text-left ml-auto">
            <Popover.Button className="btn btn-sm btn-circle btn-ghost outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
              </svg>
            </Popover.Button>
            <Popover.Panel className="grid absolute mt-2 right-2 z-10 whitespace-nowrap rounded-md p-1 bg-base-100 shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
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
        }
      </div>
    </>
  );
}
