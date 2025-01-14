"use client";
import ChatWindow from "@components/ChatWindow/ChatWindow";
import { Tab, Tabs } from "@components/ui/Tab";
import Dashboard from "@components/Dashboard";
import { Profile } from "@components/Profiles/DisplayProfile";
import useSelectedConversation from "@hooks/useSelectedConversation";
import React from "react";
import { useStore } from "store/global";

function Mobile() {
  const deviceTab = useStore((s) => s.deviceTab);
  const profile = useStore((s) => s.profile);
  const conversation = useSelectedConversation();
  const selectedUser = useStore((s) => s.selectedUser);
  const selectedGroup = useStore((s) => s.selectedGroup);
  const users = useStore((s) => s.users);

  const user =
    selectedUser ||
    users.find(
      (s) => !s.self && conversation?.members.find((m) => m.id === s.id)
    )!;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Tabs
        activeTab={profile ? "userProfile" : deviceTab}
        initialTab="dashboard"
        direction="rtl"
      >
        <Tab component="dashboard">
          <div className="w-full h-full px-4">
            <Dashboard />
          </div>
        </Tab>
        <Tab component="chatarea">
          <ChatWindow />
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
  );
}

export default Mobile;
