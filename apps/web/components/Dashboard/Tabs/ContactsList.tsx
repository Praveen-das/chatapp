"use client";
import React, { Fragment, useEffect } from "react";
import SearchUser from "../Components/SearchUser";
import { useStore } from "../../../store/global";
import useSocket from "../../../context/SocketProvider";
import Person from "../Components/Person";
import socket from "../../../lib/ws";
import { useConversationStore } from "../../../store/conversationStore";
import { useTabs } from "./Tabs";

const ContactsList = () => {
  const setDashboardTab = useStore(s => s.setDashboardTab)

  const users = useStore(s => s.users)

  const toggleProfile = useStore(s => s.toggleProfile);
  const setSelectedUser = useStore(s => s.setSelectedUser);
  const setSelectedConversation = useConversationStore(s => s.setSelectedConversation);
  const conversations = useConversationStore(s => s.conversations);

  const handleSelectedUser = (_selectedUser: IUser) => {
    const con = conversations.find(c => c.host === 'user' && c.members.find(m => m.id === _selectedUser.id))

    if (con) {
      setSelectedConversation(con.id)
      setSelectedUser(null)
      socket.selectedConversation = null;
    } else {
      setSelectedUser(_selectedUser)
      setSelectedConversation(null)
      socket.selectedConversation = null;
    };

    toggleProfile(false)
    setDashboardTab('dashboard');
  };

  return (
    <>
      <div className='flex h-full w-full flex-col mt-4 gap-2 overflow-y-scroll no-scrollbar'>
        {users.map((person) =>
          <Fragment key={person?.id}>
            <Person
              onClick={() => handleSelectedUser(person)}
              person={person} />
          </Fragment>
        )}
      </div>
    </>
  );
};

export default ContactsList
