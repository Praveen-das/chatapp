"use client";
import DisplayProfile from "@features/Profile/DisplayProfile";
import { Tab, Tabs } from "@features/ui/Tab";
import useMediaQuery from "@hooks/useMediaQuery";
import { AnimatePresence, motion } from "framer-motion";
import React, { memo, useEffect } from "react";
import { useMessageStore } from "store/messageStore";
import { useAttachments } from "../../store/attachments";
import { useConversationStore } from "../../store/conversationStore";
import { useStore } from "../../store/global";
import ChatArea from "./ChatArea/ChatArea";
import ChatHeader from "./ChatHeader/ChatHeader";
import ChatHeaderActions from "./ChatHeader/ChatHeaderActions";
import ChatInput from "./ChatInput/ChatInput";
import ImageSelector from "./ImageSelector/ImageSelector";

const LargeScreenLayout = DisplayProfile(LargeScreenChatWindow);
const MobileLayout = DisplayProfile(MobileChatWindow);

function ChatWindow(): JSX.Element {
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const selectedUser = useStore((s) => s.selectedUser);
  const deviceTab = useStore((s) => s.deviceTab);
  const isLg = useMediaQuery("(min-width: 1024px)");

  return (
    <div
      className={`${deviceTab === "chatarea" ? "max-sm:translate-x-0" : "max-sm:translate-x-full"} flex max-sm:fixed max-sm:inset-0 flex-1 w-full duration-300 bg-base-300 sm:rounded-2xl overflow-hidden z-50`}
    >
      {selectedUser || selectedConversation ? (
        isLg ? (
          <LargeScreenLayout />
        ) : (
          <MobileLayout />
        )
      ) : (
        <div className="w-full h-full bg-gradient-to-t from-base-200" />
      )}
    </div>
  );
}

function ChatAreaWrapper() {
  const images = useAttachments((s) => s.images);
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <div className={`w-full h-dvh flex flex-col max-sm:gap-0 sm:gap-4`}>
      {!!selectedChats.length && isMobile ? <ChatHeaderActions /> : <ChatHeader />}
      {!!images.length ? (
        <ImageSelector />
      ) : (
        <>
          <ChatArea />
          <ChatInput />
        </>
      )}
    </div>
  );
}

const variants = {
  hidden: { width: "0%", marginLeft: "-16px" },
  visible: { width: "100%", marginLeft: "0px" },
};

function clearHistory() {
  useStore.getState().profileTab.clearHistory();
}

function LargeScreenChatWindow({ children }: { children: React.ReactNode }) {
  const profile = useStore((s) => s.profile);

  return (
    <div className="w-full h-full flex flex-1 gap-4">
      <div className={`w-full flex relative h-full flex-col gap-4 duration-500 z-50`}>
        <ChatAreaWrapper />
      </div>
      <AnimatePresence onExitComplete={clearHistory} initial={false}>
        {profile && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            className="max-lg:hidden relative rounded-2xl overflow-hidden z-50"
          >
            <div className={`absolute w-[calc((100vw-(1rem*4))/3)] h-full`}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileChatWindow({ children }: { children: React.ReactNode }) {
  const profile = useStore((s) => s.profile);
  const deviceTab = useStore((s) => s.deviceTab);
  
  return (
    <div className="relative w-full h-full shadow-lg">
      <Tabs activeTab={deviceTab} direction="rtl">
        <Tab component="chatarea">
          <Tabs activeTab={profile ? "userProfile" : "chatarea"} direction="rtl">
            <Tab component="chatarea">
              <div className="w-full h-full flex flex-col">
                <ChatAreaWrapper />
              </div>
            </Tab>
            <Tab onExitComplete={clearHistory} component="userProfile">
              {children}
            </Tab>
          </Tabs>
        </Tab>
      </Tabs>
    </div>
  );
}

export default memo(ChatWindow);
