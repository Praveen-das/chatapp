"use client";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useMessageStore } from "../../../store/messageStore";
import { useStore } from "../../../store/global";
import { Popover } from "@headlessui/react";
import { useTheme } from "next-themes";
import { useConversationStore } from "../../../store/conversationStore";
import { useTabs } from "../Tabs/Tabs";

export default function Header() {
  const unreadMessages = useMessageStore(s => s.unreadMessages)
  const selectedConversation = useConversationStore(s => s.selectedConversation);
  const setDashboardTab = useStore(s=>s.setDashboardTab)

  const [totalMessages, setTotalMessages] = useState(0)

  useEffect(() => {
    let total = 0
    unreadMessages.forEach((um, key) => {
      if (selectedConversation?.id === key) return
      total += um.length
    })
    setTotalMessages(total)
  }, [unreadMessages, selectedConversation])

  const options = [
    { label: 'New Chat', handler: () => setDashboardTab('contacts') },
    { label: 'New Group', handler: () => setDashboardTab("addMembersToGroup") },
    { label: 'Select Chats', handler: () => null },
    { label: 'Settings', handler: () => setDashboardTab("settings") },
  ]

  const { theme, setTheme } = useTheme()

  const handleChange = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <div className='min-h-16 flex justify-between items-center'>
        <div className="flex items-center gap-2">
          <label className='text-xl font-bold' htmlFor="">Messages</label>
          {
            totalMessages > 0 ?
              <span className="flex items-center justify-center text-white rounded-full text-xs w-[20px] h-[20px] bg-primary">
                {totalMessages}
              </span>
              : <span />
          }
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setDashboardTab('addMembersToGroup')} className='btn btn-sm btn-circle btn-ghost ' >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </button>
          <button onClick={() => setDashboardTab('contacts')} className='btn btn-sm btn-ghost btn-circle ' >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </button>
          <Popover as="div" className="relative  inline-block text-left ml-auto">
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
        </div>
      </div>
    </>
  );
}
