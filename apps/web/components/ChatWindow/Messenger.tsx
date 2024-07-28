"use client";
import React from "react";
import { useStore } from "../../store/global";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import { ChatInput } from "./components/ChatInput/ChatInput";
import ChatArea from "./components/ChatArea/ChatArea";
import { useAttachments } from "../../store/attachments";
import ImageSelector from "./components/ImageSelector/ImageSelector";
import { useConversationStore } from "../../store/conversationStore";
import Link from "next/link";

export function getTotalMessages(map: Map<string, IUnreadMessageMeta[]>) {
  let totalLength = 0;
  for (let array of map.values()) {
    totalLength += array.length;
  }
  return totalLength;
}

export default function ChatWindow(): JSX.Element {
  const selectedUser = useStore(s => s.selectedUser)
  const selectedConversation = useConversationStore(s => s.selectedConversation)
  const images = useAttachments(s => s.images)
  const profile = useStore(s => s.profile)

  if (selectedUser || selectedConversation)
    return (
      <div className={`${profile ? 'w-2/3' : 'w-1/3'} duration-500 flex flex-col gap-4 flex-1 h-full`}>
        <ChatHeader />
        {
          !images.length ?
            // false ?
            <>
              <ChatArea />
              <ChatInput />
            </> :
            <ImageSelector />
        }
      </div>
    )
  else return <div className="flex-1 h-full bg-gradient-to-t from-base-100 shadow-lg rounded-2xl" >
    <Link href='http://localhost:3000/942ed943-f14f-4504-b979-29987c74d9fb'>click</Link>
  </div>
}


