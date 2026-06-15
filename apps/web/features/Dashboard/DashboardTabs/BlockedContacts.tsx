"use client";

import React from "react";
import useSocket from "../../../context/SocketProvider";
import { useStore } from "../../../store/global";
import useAuth from "../../../hooks/useAuth";
import { useConversationStore } from "store/conversationStore";
import { IUserConversation } from "@repo/interfaces/conversationInterface";
import Header from "./SharedComponents/Header";
import { PlusIcon } from "@heroicons/react/24/solid";
import Avatar from "@features/ui/Avatar";
import { getReceiverMetadata, getUserFromMetadata } from "@lib/conversation";

function BlockedContacts() {
  const setModal = useStore((s) => s.setModal);
  const { sendUserUnBlockRequest } = useSocket();
  const conversations = useConversationStore((s) => s.conversations);

  function toggleModal() {
    setModal({ activeModal: "addBlockedContactModal", open: true });
  }

  function handleUnblockingUser(conversation: IUserConversation) {
    sendUserUnBlockRequest(conversation);
  }

  const blockedConversations = conversations.filter((c): c is IUserConversation => c.host === "user" && c.blocked!);

  return (
    <div className="flex flex-col h-full">
      <Header title="Blocked Contacts" mainTab="settings" />
      <div className="flex flex-col max-sm:gap-2 sm:gap-4 max-sm:mt-2 sm:mt-4">
        <div className="grid pb-2 gap-2 overflow-y-scroll no-scrollbar">
          {blockedConversations.map((conversation) => {
            const receiver = getUserFromMetadata(getReceiverMetadata(conversation)!);
            return (
              <div
                key={conversation.id}
                className="group flex items-center justify-between gap-4 w-full px-4 py-3 min-h-[75px] rounded-2xl hover:bg-base-content/[0.03] active:scale-[0.99] transition-all duration-150 outline-none"
              >
                <Avatar
                  url={receiver?.profilePicture}
                  profileHidden={receiver?.rules?.includes("hide_profilepicture")!}
                  onlineIndication={false}
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <h2 className="text-[14px] font-semibold text-base-content/90 truncate">
                    {conversation.displayName}
                  </h2>
                  <span className="text-xs text-base-content/50 truncate">
                    {conversation.id}
                  </span>
                </div>
                <div
                  onClick={() => handleUnblockingUser(conversation)}
                  tabIndex={0}
                  className="btn btn-circle btn-ghost btn-sm bg-base-100/40 border border-base-content/5 backdrop-blur-md hover:bg-base-content/10 transition-all duration-150 flex justify-center items-center"
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
            );
          })}
        </div>
        <div
          onClick={toggleModal}
          className="absolute bottom-4 right-2 btn btn-circle btn-primary text-[--black-white] grid place-items-center size-14 bg-primary rounded-full overflow-hidden"
        >
          <PlusIcon className="size-6" />
        </div>
      </div>
    </div>
  );
}

export default BlockedContacts;
