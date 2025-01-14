"use client";

import React from "react";
import useSocket from "../../../context/SocketProvider";
import { useStore } from "../../../store/global";
import useAuth from "../../../hooks/useAuth";
import { useConversationStore } from "store/conversationStore";
import { IUserConversation } from "@interfaces/conversationInterface";
import Header from "../components/Header";

function BlockedContacts() {
  const setModal = useStore((s) => s.setModal);
  const { sendUserUnBlockRequest } = useSocket();
  const conversations = useConversationStore((s) => s.conversations);

  function toggleModal() {
    setModal({ activeModal: "addBlockedContactModal",open:true });
  }

  function handleUnblockingUser(conversation: IUserConversation) {
    sendUserUnBlockRequest(conversation)
  }

  const blockedConversations = conversations.filter(
    (c): c is IUserConversation => c.host === "user" && c.blocked!
  );

  return (
    <div className="flex flex-col h-full">
      <Header title="Blocked Contacts" mainTab="settings" />
      <div className="flex flex-col max-sm:gap-2 sm:gap-4 max-sm:mt-2 sm:mt-4">
        <div onClick={toggleModal} className="btn btn-primary text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
            />
          </svg>
          Add blocked contact
        </div>
        <div className="grid pb-2 gap-2 overflow-y-scroll no-scrollbar">
          {blockedConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="flex items-center justify-between gap-4 w-full p-3 rounded-2xl"
            >
              <div className="size-10 bg-slate-500 rounded-full"></div>
              <div className="flex flex-col w-full flex-1">
                <label className="text-sm" htmlFor="username">
                  {conversation.displayName}
                </label>
                <label className="text-xs" htmlFor="username">
                  {conversation.id}
                </label>
              </div>
              <div
                onClick={() => handleUnblockingUser(conversation)}
                tabIndex={0}
                className="btn btn-circle btn-ghost btn-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BlockedContacts;
