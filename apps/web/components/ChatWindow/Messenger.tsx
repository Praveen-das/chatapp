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
import { IUnreadMessageMeta } from "../../interfaces/messageInterface";

export function getTotalMessages(map: Map<string, IUnreadMessageMeta[]>) {
  let totalLength = 0;
  for (let array of map.values()) {
    totalLength += array.length;
  }
  return totalLength;
}

export default function ChatWindow(): JSX.Element {
  const selectedUser = useStore((s) => s.selectedUser);
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );
  const images = useAttachments((s) => s.images);
  const profile = useStore((s) => s.profile);
  
  const containerWidth = profile ? "w-full max-w-[calc((100%-(1rem*2))/3)]" : "w-full max-w-full"

  if (selectedUser || selectedConversation)
    return (
      <div
        className={`${containerWidth} duration-500 flex flex-col gap-4 h-full`}
      >
        <ChatHeader />
        {!images.length ? (
          <>
            <ChatArea />
            <ChatInput />
          </>
        ) : (
          <ImageSelector />
        )}
      </div>
    );
  else
    return (
      <div className="w-full h-full bg-gradient-to-t from-base-200 shadow-lg rounded-2xl">
      </div>
    );
}
