"use client";
import React, { memo } from "react";
import { useStore } from "../../store/global";
import { useConversationStore } from "../../store/conversationStore";
import Link from "next/link";
import { IUnreadMessageMeta } from "../../interfaces/messageInterface";
import { AnimatePresence, motion } from "framer-motion";
import DisplayProfile, { Profile } from "@components/Profiles/DisplayProfile";
import Tabs from "@components/Dashboard/Tabs/Tabs";
import Tab from "@components/Dashboard/Components/Tab";
import useSelectedConversation from "@hooks/useSelectedConversation";
import useMediaQuery from "@hooks/useMediaQuery";
import _ChatWindow from "./_ChatWindow";

function ChatWindow(): JSX.Element {
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );
  const profile = useStore((s) => s.profile);
  const conversation = useSelectedConversation();
  const selectedUser = useStore((s) => s.selectedUser);
  const selectedGroup = useStore((s) => s.selectedGroup);
  const users = useStore((s) => s.users);
  const deviceTab = useStore((s) => s.deviceTab);
  const isLg = useMediaQuery("(min-width: 1024px)");

  const user =
    selectedUser ||
    users.find(
      (s) => !s.self && conversation?.members.find((m) => m.id === s.id)
    )!;

  return (
    <div
      className={`${deviceTab === "chatarea" ? "max-sm:translate-x-0" : "max-sm:translate-x-full"} flex max-sm:fixed max-sm:inset-0 flex-1 w-full duration-300 bg-base-300 sm:rounded-2xl overflow-hidden z-50`}
    >
      {selectedUser || selectedConversation ? (
        !isLg ? (
          <div className="relative w-full h-full shadow-lg">
            <Tabs
              activeTab={profile ? "userProfile" : "chatarea"}
              initialTab="chatarea"
              direction="rtl"
            >
              <Tab component="chatarea">
                <_ChatWindow />
              </Tab>
              <Tab component="userProfile">
                <Profile
                  group={selectedGroup!}
                  user={user}
                  conversation={conversation!}
                />
              </Tab>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-1 gap-4">
            <div
              className={`w-full flex relative h-full flex-col gap-4 duration-500 z-50`}
              // style={{ left: deviceTab === "chatarea" ? "0%" : "100%" }}
            >
              <_ChatWindow />
            </div>
            <DisplayProfile />
          </div>
        )
      ) : (
        <div className="w-full h-full bg-gradient-to-t from-base-200" />
      )}
    </div>
  );
}

export default memo(ChatWindow)
