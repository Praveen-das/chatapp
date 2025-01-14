"use client";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import { useStore } from "../../../store/global";
import Person from "../components/Person";
import socket from "../../../lib/ws";
import { useConversationStore } from "../../../store/conversationStore";
import SearchUser from "../../ui/Searchbar";
import { IUser } from "../../../interfaces/userInterface";
import SecondaryHeader from "../components/Header";

const ContactsList = () => {
  const setDashboardTab = useStore(s => s.setDashboardTab)
  const users = useStore(s => s.users)
  const toggleProfile = useStore(s => s.toggleProfile);
  const setDeviceTab = useStore(s => s.setDeviceTab);
  const setSelectedUser = useStore(s => s.setSelectedUser);
  const setSelectedConversation = useConversationStore(s => s.setSelectedConversation);
  const conversations = useConversationStore(s => s.conversations);

  const [query, setQuery] = useState('')

  const queryResult = useMemo(() => {
    if (!query) return []
    return users.filter(user => user.username.includes(query))
  }, [query, users])

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
    setDeviceTab('chatarea');
    setDashboardTab('dashboard');
  };

  return (
    <div className="flex flex-col max-sm:gap-2 sm:gap-4 h-full overflow-hidden">
      <SecondaryHeader title="New Chat" mainTab="dashboard" />
      <SearchUser onChange={setQuery} />
      <div className='flex h-full w-full flex-col mt-4 gap-2 overflow-y-scroll no-scrollbar'>
        {(query ? queryResult : users).map((person) =>
          <Fragment key={person?.id}>
            <Person
              onClick={() => handleSelectedUser(person)}
              person={person} />
          </Fragment>
        )}
      </div>
    </div>
  );
};

export default ContactsList
