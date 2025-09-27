"use client";

import Conversations from "./DashboardTabs/Conversations/Conversations";
import ContactsList from "./DashboardTabs/ContactsList";
import GroupCreationTab from "./DashboardTabs/GroupCreationTab";
import GroupMembersSelectionTab from "./DashboardTabs/GroupMembersSelectionTab";
import Settings from "./DashboardTabs/Settings";
import GeneralSettings from "./DashboardTabs/GeneralSettings";
import BlockedContacts from "./DashboardTabs/BlockedContacts";
import Archive from "./DashboardTabs/Archive";
import { Tab, Tabs } from "@features/ui/Tab";
import { useStore } from "../../store/global";
import ActiveSessions from "./DashboardTabs/ActiveSessions";
import FetchedUser from "./DashboardTabs/FetchedUser";
import useMediaQuery from "@hooks/useMediaQuery";
import { useEffect } from "react";

// async function getContactData() {
//   const supported = "contacts" in navigator && "ContactsManager" in window;

//   if (supported) {
//     console.log(navigator.contacts);
//     const props = await navigator.contacts.getProperties();
//     const options = { multiple: true };

//     try {
//       const contacts = await navigator.contacts.select(props, options);

//       if (contacts.length) {
//         alert(JSON.stringify(contacts));
//         // code managing the selected data
//       } else {
//         // code when nothing was selected
//       }
//     } catch (ex) {
//       // code if there was an error
//     }
//   }
// }

export default function Dashboard(): JSX.Element {
  const dashboardTab = useStore((s) => s.dashboardTab);
  const deviceTab = useStore((s) => s.deviceTab);
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <div
      className={`${deviceTab === "chatarea" ? "max-sm:opacity-0 max-sm:z-0" : "opacity-100"} max-sm:duration-300 relative max-sm:w-full sm:w-1/2 lg:w-[calc((100vw-(1rem*4))/3)] max-sm:h-dvh z-[50]`}
    >
      <Tabs activeTab={isMobile ? deviceTab || 'dashboard' : 'dashboard'} initialTab="dashboard">
        <Tab component="dashboard">
          <Tabs activeTab={dashboardTab} initialTab="dashboard">
            <Tab component="dashboard">
              <Conversations />
            </Tab>
            <Tab component="fetchedUser">
              <FetchedUser />
            </Tab>
            <Tab component="contacts">
              <ContactsList />
            </Tab>
            <Tab component="archive">
              <Archive />
            </Tab>

            {/* group creation */}
            <Tab component="addMembersToGroup">
              <GroupMembersSelectionTab />
            </Tab>
            <Tab component="createGroup">
              <GroupCreationTab />
            </Tab>

            {/* settings */}
            <Tab component="settings">
              <Settings />
            </Tab>
            <Tab component="generalSettings">
              <GeneralSettings />
            </Tab>
            <Tab component="blockedContacts">
              <BlockedContacts />
            </Tab>
            <Tab component="activeSessions">
              <ActiveSessions />
            </Tab>
          </Tabs>
        </Tab>
      </Tabs>
    </div>
  );
}
