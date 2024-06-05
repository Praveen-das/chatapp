"use client";
import React from "react";
import { useStore } from "../../store/global";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import { ChatInput } from "./components/ChatInput/ChatInput";
import ChatArea from "./components/ChatArea/ChatArea";
import { useAttachments } from "../../store/attachments";
import ImageSelector from "./components/ImageSelector/ImageSelector";

export function getTotalMessages(map: Map<string, IUnreadMessageMeta[]>) {
  let totalLength = 0;
  for (let array of map.values()) {
    totalLength += array.length;
  }
  return totalLength;
}

export default function Messenger(): JSX.Element {
  const selectedUser = useStore(s => s.selectedUser)
  const selectedConversation = useStore(s => s.selectedConversation)
  const images = useAttachments(s => s.images)

  if (selectedUser || selectedConversation)
    return (
      <div className='flex flex-col gap-4 w-3/5 h-full'>
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
  else return <div className="w-3/5 h-full bg-gradient-to-t from-zinc-700 rounded-2xl"></div>
}


