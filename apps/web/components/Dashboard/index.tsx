"use client";

import Conversations from "./Tabs/Conversations/Conversations";
import ContactsList from "./Tabs/ContactsList";
import GroupCreationTab from "./Tabs/GroupCreationTab";
import GroupMembersSelectionTab from "./Tabs/GroupMembersSelectionTab";
import Settings from "./Tabs/Settings";
import { Tab, Tabs } from "@components/ui/Tab";
import GeneralSettings from "./Tabs/GeneralSettings";
import BlockedContacts from "./Tabs/BlockedContacts";
import { useStore } from "../../store/global";
import Archive from "./Tabs/Archive";

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

  return (
    <div
      className={`${deviceTab === "chatarea" ? "max-sm:opacity-0" : "opacity-100"} max-sm:duration-300 relative max-sm:w-full sm:w-1/2 lg:w-[calc((100vw-(1rem*4))/3)] max-sm:h-dvh z-[60]`}
    >
      <Tabs activeTab={dashboardTab} initialTab="dashboard">
        <Tab component="dashboard">
          <Conversations />
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
      </Tabs>
    </div>
  );
}
