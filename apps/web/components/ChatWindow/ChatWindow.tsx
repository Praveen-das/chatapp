"use client";
import React, { memo, useMemo } from "react";
import { useStore } from "../../store/global";
import { useConversationStore } from "../../store/conversationStore";
import DisplayProfile, { Profile } from "@components/Profiles/DisplayProfile";
import { Tab, Tabs } from "@components/ui/Tab";
import useSelectedConversation from "@hooks/useSelectedConversation";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import ChatInput from "./components/ChatInput/ChatInput";
import ChatArea from "./components/ChatArea/ChatArea";
import { useAttachments } from "../../store/attachments";
import ImageSelector from "./components/ImageSelector/ImageSelector";
import { useMessageStore } from "store/messageStore";
import ChatHeaderActions from "./components/ChatHeader/ChatHeaderActions";
import useMediaQuery from "@hooks/useMediaQuery";

function ChatWindow(): JSX.Element {
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );
  const selectedUser = useStore((s) => s.selectedUser);
  const deviceTab = useStore((s) => s.deviceTab);
  const isLg = useMediaQuery("(min-width: 1024px)");

  return (
    <div
      className={`${deviceTab === "chatarea" ? "max-sm:translate-x-0" : "max-sm:translate-x-full"} flex max-sm:fixed max-sm:inset-0 flex-1 w-full duration-300 bg-base-300 sm:rounded-2xl overflow-hidden z-50`}
    >
      {selectedUser || selectedConversation ? (
        isLg ? (
          <LargeScreenChatLayout />
        ) : (
          <MobileChatLayout />
        )
      ) : (
        <div className="w-full h-full bg-gradient-to-t from-base-200" />
      )}
    </div>
  );
}

function ChatLayoutWrapper() {
  const images = useAttachments((s) => s.images);
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <div className={`w-full h-dvh flex flex-col max-sm:gap-0 sm:gap-4`}>
      {!!selectedChats.length && isMobile ? (
        <ChatHeaderActions />
      ) : (
        <ChatHeader />
      )}
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

function LargeScreenChatLayout() {
  return (
    <div className="w-full h-full flex flex-1 gap-4">
      <div
        className={`w-full flex relative h-full flex-col gap-4 duration-500 z-50`}
      >
        <ChatLayoutWrapper />
      </div>
      <DisplayProfile />
    </div>
  );
}

function MobileChatLayout() {
  const profile = useStore((s) => s.profile);
  const conversation = useSelectedConversation();
  const selectedGroup = useStore((s) => s.selectedGroup);
  const users = useStore((s) => s.users);
  const setProfileTab = useStore((s) => s.setProfileTab);
  const selectedUser = useStore((s) => s.selectedUser);

  const user = useMemo(() => {
    return (
      selectedUser ||
      users.find(
        (u) => !u.self && conversation?.members.some((m) => m.id === u.id)
      )!
    );
  }, [selectedUser, users, conversation]);

  return (
    <div className="relative w-full h-full shadow-lg">
      <Tabs
        activeTab={profile ? "userProfile" : "chatarea"}
        initialTab="chatarea"
        direction="rtl"
      >
        <Tab component="chatarea">
          <div className="w-full h-full flex flex-col">
            <ChatLayoutWrapper />
          </div>
        </Tab>
        <Tab onExitComplete={() => setProfileTab("")} component="userProfile">
          <Profile
            group={selectedGroup!}
            user={user}
            conversation={conversation!}
          />
        </Tab>
      </Tabs>
    </div>
  );
}

export default memo(ChatWindow);
