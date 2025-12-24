"use client";

import { Tab, Tabs } from "@features/ui/Tab";
import { useConversationStore } from "store/conversationStore";
import { IConversation } from "@repo/interfaces/conversationInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { useStore } from "../../store/global";
import GroupProfile from "./ProfileTabs/GroupProfileTabs/GroupProfile";
import LinkManagement from "./ProfileTabs/GroupProfileTabs/LinkManagement";
import StarredMessagess from "./ProfileTabs/StarredMessagess";
import UserMedia from "./ProfileTabs/UserMedia";
import UserProfile from "./ProfileTabs/UserProfileTabs/UserProfile";
import { useMemo } from "react";
import { getReceiverMetadata, getUserFromMetadata } from "@lib/conversation";
import SystemProfile from "./ProfileTabs/SystemProfile";
import AiProfile from "./ProfileTabs/AiProfile";

function DisplayProfile(TransitionComponent: React.FC<{ children: React.ReactNode }>) {
  return () => {
    const selectedUser = useStore((s) => s.selectedUser);
    const selectedConversation = useConversationStore((s) => s.selectedConversation);

    const user = useMemo(
      () => selectedUser ?? getUserFromMetadata(getReceiverMetadata(selectedConversation!)!),
      [selectedUser, selectedConversation]
    );

    return useMemo(
      () => (
        <TransitionComponent>
          <Profile conversation={selectedConversation!} selectedUser={user!} />
        </TransitionComponent>
      ),
      [selectedConversation, user]
    );
  };
}

type IProfile = {
  conversation: IConversation;
  selectedUser: IUser;
};

export function Profile({ conversation, selectedUser }: IProfile) {
  const profileTab = useStore((s) => s.profileTab);

  return (
    <div className={`relative w-full h-full bg-[--base-200-300] pt-4`}>
      <Tabs activeTab={profileTab.getTab()} direction="rtl">
        <Tab component="conversation">
          {conversation?.host === "group" ? (
            <GroupProfile groupId={conversation.id} />
          ) : conversation?.host === "user" ? (
            <UserProfile user={selectedUser} />
          ) : conversation?.host === "system" ? (
            <SystemProfile />
          ) : conversation?.host === "ai" ? (
            <AiProfile />
          ) : null}
        </Tab>
        <Tab component="user">
          <UserProfile user={selectedUser} showChatOption />
        </Tab>
        <Tab component="inviteLink">
          <LinkManagement conversationId={conversation?.id} />
        </Tab>
        <Tab component="media">
          <UserMedia />
        </Tab>
        <Tab component="starred_messages">
          <StarredMessagess />
        </Tab>
      </Tabs>
    </div>
  );
}

export default DisplayProfile;
