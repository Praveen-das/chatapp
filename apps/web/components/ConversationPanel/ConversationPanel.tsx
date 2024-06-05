"use client";
import React, { Fragment, useEffect, useState } from "react";
import SearchUser from "./components/SearchUser";
import Header from "./components/Header";
import Conversations from "./Conversations";
import { useStore } from "../../store/global";
import { useSocket } from "../../context/SocketProvider";
import Person from "./components/Person";
import { useMessages } from "../../store/messageStore";


export default function ConversationPanel(): JSX.Element {
  const menuOption = useStore(s => s.menuOption)

  return (
    <div className="relative w-2/5 h-full">
      <div className="flex flex-col gap-4 w-full h-full">
        <Header />
        <SearchUser />
        <Conversations />
      </div>
      <Panel open={menuOption === 'contacts'}>
        <ContactsList />
      </Panel>
      <Panel open={menuOption === 'addMembersToGroup'}>
        <GroupMembersSelectionPanel />
      </Panel>
      <Panel open={menuOption === 'createGroup'}>
        <GroupCreationPannel />
      </Panel>
    </div >
  );
}

const ContactsList = () => {
  const setMenuOption = useStore(s => s.setMenuOption)
  const { users } = useSocket();
  const conversations = useMessages(s => s.conversations)

  const setSelectedUser = useStore(s => s.setSelectedUser);
  const setSelectedConversation = useStore(s => s.setSelectedConversation);

  const handleSelectedUser = (_selectedUser: IUser) => {
    setSelectedConversation(null)
    const userId = _selectedUser.userId;

    let conversation: IIConversation | undefined = conversations.find(s => s.members.includes(userId) && s.host === 'user')

    conversation ?
      setSelectedConversation(conversation) :
      setSelectedUser(_selectedUser)

    setMenuOption(null)
  };

  return (
    <>
      <div className='flex justify-between items-end min-h-14'>
        <div className="flex items-center gap-2">
          <label className='text-white text-xl font-bold' htmlFor="">New Chat</label>
        </div>
        <button onClick={() => setMenuOption(null)} className='btn btn-sm btn-ghost btn-circle text-white' >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <SearchUser />
      <div className='flex h-full w-full flex-col mt-4 gap-2 overflow-y-scroll no-scrollbar'>
        {
          users.map((person) =>
            <Fragment key={person?.userId}>
              <Person
                onClick={() => handleSelectedUser(person)}
                person={person}
              />
              <span className='w-full border-b-[1px] border-black border-opacity-20 last:border-none' />
            </Fragment>
          )
        }
      </div>
    </>
  )
}

const GroupMembersSelectionPanel = () => {
  const setMenuOption = useStore(s => s.setMenuOption)
  const setSelectedGroupMembers = useStore(s => s.setSelectedGroupMembers)
  const selectedGroupMembers = useStore(s => s.selectedGroupMembers)
  const { users } = useSocket();
  console.log('GroupMembersSelectionPanel');

  const handleClose = () => {
    setSelectedGroupMembers(null)
    setMenuOption(null)
  }

  const removeUser = (userId: string) => {
    setSelectedGroupMembers(userId)
  }

  const handleSelectedUser = (userId: string) => {
    setSelectedGroupMembers(userId)
  };

  return (
    <>
      <div className='flex justify-between items-end min-h-14'>
        <div className="flex items-center gap-2">
          <label className='text-white text-xl font-bold' htmlFor="">Add group members</label>
        </div>
        <button onClick={handleClose} className='btn btn-sm btn-ghost btn-circle text-white' >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <SearchUser />
      <div className="flex gap-2 justify-between items-center">
        <div className="flex gap-1 items-center text-xs w-full whitespace-nowrap overflow-scroll no-scrollbar">
          {
            selectedGroupMembers.map((userId, idx) => (
              <label key={userId} onClick={() => removeUser(userId)} className="truncate min-w-36 bg-zinc-700 text-white px-2 py-1 rounded-full cursor-pointer hover:line-through" htmlFor="">{userId}</label>
            ))
          }
        </div>
      </div>
      <div className='flex h-full w-full flex-col mt-4 gap-2 overflow-y-scroll no-scrollbar'>
        {
          users.map((person) =>
            <Fragment key={person?.userId}>
              <Person
                onClick={() => handleSelectedUser(person.userId)}
                person={person}
                isSelected={selectedGroupMembers.some(s => s === person.userId)}
              />
              <span className='w-full border-b-[1px] border-black border-opacity-20 last:border-none' />
            </Fragment>
          )
        }
      </div>
      <div className={`${selectedGroupMembers.length === 0 ? 'hidden' : 'flex'} justify-center pb-4`}>
        <button onClick={() => setMenuOption('createGroup')} className="btn btn-circle btn-md">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7 ">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </>
  )
}

const GroupCreationPannel = () => {
  const setMenuOption = useStore(s => s.setMenuOption)
  const setSelectedGroupMembers = useStore(s => s.setSelectedGroupMembers)
  const selectedGroupMembers = useStore(s => s.selectedGroupMembers)
  const { sendGroupCreationRequest } = useSocket()

  const [displayName, setGroupName] = useState('')

  const handleClose = () => {
    setSelectedGroupMembers(null)
    setMenuOption(null)
  }

  const handleSubmit = () => {
    sendGroupCreationRequest(displayName, selectedGroupMembers)
    handleClose()
  }

  return (
    <>
      <div className='flex justify-between items-end min-h-14'>
        <div className="flex items-center gap-2">
          <label className='text-white text-xl font-bold' htmlFor="">Create Group</label>
        </div>
        <button onClick={handleClose} className='btn btn-sm btn-ghost btn-circle text-white' >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col items-center py-8 h-full w-full">
        <div className="size-52 rounded-full bg-slate-600 flex items-center justify-center">
          <label className="text-xl text-wrap text-center" htmlFor="">Group icon</label>
        </div>
        <label className="form-control w-full max-w-sm my-auto">
          <div className="label">
            <span className="label-text">Group name</span>
          </div>
          <input onChange={e => setGroupName(e.target.value)} type="text" placeholder="Group name" className="input rounded-2xl w-full " />
        </label>
      </div>
      <div className="flex justify-center pb-8">
        <button onClick={handleSubmit} className="btn btn-circle btn-md">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7 ">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </>
  )
}

const Panel = ({ children, open }: { children: React.ReactNode, open: boolean }) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => { open && setIsOpen(true) }, [open])

  return (
    <div
      onTransitionEnd={() => !open && setIsOpen(false)}
      className={`absolute top-0 flex flex-col gap-4 w-full h-full z-10 bg-zinc-900 duration-300 ${open ? 'translate-x-0' : '-translate-x-[120%]'}`}
    >
      {isOpen && children}
    </div>
  )
}



