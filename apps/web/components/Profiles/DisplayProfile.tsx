"use client";

import React from "react";
import { useStore } from "../../store/global";
import { AnimatePresence, motion } from "framer-motion";
import GroupProfile from "./GroupProfile";
import UserProfile from "./UserProfile";
import Tabs from "../Dashboard/Tabs/Tabs";
import Tab from "../Dashboard/Components/Tab";
import LinkManagement from "./LinkManagement";
import UserMedia from "./UserMedia";
import useSelectedConversation from "../../hooks/useSelectedConversation";
import {
  IGroupConversation,
  IConversation,
} from "../../interfaces/conversationInterface";
import { IUser } from "../../interfaces/userInterface";

function DisplayProfile() {
  const conversation = useSelectedConversation();
  const selectedUser = useStore((s) => s.selectedUser);
  const selectedGroup = useStore((s) => s.selectedGroup);
  const users = useStore((s) => s.users);
  const profile = useStore((s) => s.profile);

  const user =
    selectedUser ||
    users.find(
      (s) => !s.self && conversation?.members.find((m) => m.id === s.id)
    )!;

  const variants = {
    hidden: { width: "0%",marginLeft:'-16px' },
    visible: { width: "100%",marginLeft:'0px' },
  };

  return (
    <AnimatePresence>
      {profile && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          className="max-lg:hidden relative rounded-2xl overflow-hidden"
        >
          <div
            className={`absolute w-[calc((100vw-(1rem*3))/3)] h-full`}
          >
            <Profile
              group={selectedGroup!}
              user={user}
              conversation={conversation!}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Profile({
  user,
  group,
  conversation,
}: {
  user: IUser;
  group: IGroupConversation;
  conversation: IConversation;
}) {
  const profileTab = useStore((s) => s.profileTab);

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-t from-base-200 sm:rounded-2xl overflow-hidden`}
    >
      <Tabs activeTab={profileTab} initialTab="conversation" direction="rtl">
        <Tab component="conversation">
          {conversation?.host === "group" ? (
            <GroupProfile conversation={conversation} />
          ) : (
            <UserProfile user={user!} />
          )}
        </Tab>
        <Tab component="user">
          <UserProfile user={user!} showChatOption />
        </Tab>
        <Tab component="group">
          <GroupProfile conversation={group} />
        </Tab>
        <Tab component="inviteLink">
          <LinkManagement
            selectedConversation={conversation as IGroupConversation}
          />
        </Tab>
        <Tab component="media">
          <UserMedia conversation={conversation} />
        </Tab>
      </Tabs>
    </div>
  );
}

export default DisplayProfile;
