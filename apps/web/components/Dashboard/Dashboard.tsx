"use client";

import Header from "./Components/Header";
import Conversations from "./Tabs/Conversations";
import ContactsList from "./Tabs/ContactsList";
import GroupCreationTab from "./Tabs/GroupCreationTab";
import GroupMembersSelectionTab from "./Tabs/GroupMembersSelectionTab";
import Settings from "./Tabs/Settings";
import Tab from "./Components/Tab";
import SecondaryHeader from "./Components/SecondaryHeader";
import GeneralSettings from "./Tabs/GeneralSettings";
import BlockedContacts from "./Tabs/BlockedContacts";
import Tabs from "./Tabs/Tabs";
import { useStore } from "../../store/global";
import Archive from "./Tabs/Archive";

export default function Dashboard(): JSX.Element {
  const dashboardTab = useStore((s) => s.dashboardTab);
  const deviceTab = useStore((s) => s.deviceTab);

  return (
    // <div className="relative w-full max-w-[calc((100%-(1rem*2))/3)] h-full overflow-hidden">
    <div
      className={`${deviceTab === "chatarea" ? "max-sm:opacity-0" : "opacity-100"} max-sm:duration-300 relative max-sm:w-full sm:w-1/2 lg:w-[calc((100vw-(1rem*4))/3)] max-sm:h-dvh`}
    >
      {/* conversations */}
      <Tabs activeTab={dashboardTab} initialTab="dashboard">
        <Tab component="dashboard">
          <Header />
          <Conversations />
        </Tab>
        <Tab component="contacts">
          <SecondaryHeader title="New Chat" mainTab="dashboard" />
          <ContactsList />
        </Tab>
        <Tab component="archive">
          <SecondaryHeader title="Archived chats" mainTab="dashboard" />
          <Archive />
        </Tab>

        {/* group creation */}
        <Tab component="addMembersToGroup">
          <SecondaryHeader title="Add group members" mainTab="dashboard" />
          <GroupMembersSelectionTab />
        </Tab>
        <Tab component="createGroup">
          <SecondaryHeader title="Create Group" mainTab="addMembersToGroup" />
          <GroupCreationTab />
        </Tab>

        {/* settings */}
        <Tab component="settings">
          <SecondaryHeader title="Settings" mainTab="dashboard" />
          <Settings />
        </Tab>
        <Tab component="generalSettings">
          <SecondaryHeader title="General Settings" mainTab="settings" />
          <GeneralSettings />
        </Tab>
        <Tab component="blockedContacts">
          <SecondaryHeader title="Blocked Contacts" mainTab="settings" />
          <BlockedContacts />
        </Tab>
      </Tabs>
    </div>
  );
}
