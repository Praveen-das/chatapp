"use client";
import React, { memo } from "react";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import ChatInput from "./components/ChatInput/ChatInput";
import ChatArea from "./components/ChatArea/ChatArea";
import { useAttachments } from "../../store/attachments";
import ImageSelector from "./components/ImageSelector/ImageSelector";
import { useMessageStore } from "store/messageStore";
import Actions from "./components/ChatHeader/Actions";
import useMediaQuery from "@hooks/useMediaQuery";

function _ChatWindow() {
  const images = useAttachments((s) => s.images);
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <div className={`w-full h-dvh flex flex-col max-sm:gap-0 sm:gap-4`}>
      {!!selectedChats.length && isMobile ? <Actions /> : <ChatHeader />}
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
}

export default memo(_ChatWindow)
