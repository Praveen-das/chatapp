"use client";

import { Tab, Tabs } from "@features/ui/Tab";
import { useConversationStore } from "store/conversationStore";
import { IConversation } from "../../interfaces/conversationInterface";
import { IUser } from "../../interfaces/userInterface";
import { useStore } from "../../store/global";
import GroupProfile from "./ProfileTabs/GroupProfileTabs/GroupProfile";
import LinkManagement from "./ProfileTabs/GroupProfileTabs/LinkManagement";
import StarredMessagess from "./ProfileTabs/StarredMessagess";
import UserMedia from "./ProfileTabs/UserMedia";
import UserProfile from "./ProfileTabs/UserProfileTabs/UserProfile";
import { useMemo } from "react";
import { getReceiver } from "@lib/conversation";

function DisplayProfile(TransitionComponent: React.FC<{ children: React.ReactNode }>) {
  return () => {
    const selectedUser = useStore((s) => s.selectedUser);
    const selectedConversation = useConversationStore((s) => s.selectedConversation);

    const users = useStore((s) => s.users);
    const user = selectedUser ?? users.find((u) => u.id === getReceiver(selectedConversation!)?.id);

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
    <div className={`relative w-full h-full sm:rounded-2xl overflow-hidden`}>
      <Tabs activeTab={profileTab.getTab()} direction="rtl">
        <Tab component="conversation">
          {conversation?.host === "group" ? (
            <GroupProfile conversationId={conversation.id} />
          ) : (
            <UserProfile user={selectedUser} showChatOption />
          )}
        </Tab>
        <Tab component="user">
          <UserProfile user={selectedUser} showChatOption />
        </Tab>
        <Tab component="inviteLink">
          <LinkManagement conversationId={conversation?.id} />
        </Tab>
        <Tab component="media">
          <UserMedia conversationId={conversation?.id} />
        </Tab>
        <Tab component="starred_messages">
          <StarredMessagess conversationId={conversation?.id} />
        </Tab>
      </Tabs>
    </div>
  );
}

export default DisplayProfile;
