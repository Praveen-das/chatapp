"use client";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useStore } from "../../../store/global";
import useAuth from "../../../hooks/useAuth";
import { useTheme } from "next-themes";
import EmojiPicker from '../../ChatWindow/components/ChatInput/EmojiPicker';
import { flip, shift, useFloating } from "@floating-ui/react";
import GeneralSettings from "./GeneralSettings";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import motionconfig from '../../../config/config'
import { Avatar } from "../Components/Avatar";
import TextArea from "../../ui/TextArea";
import { useTabs } from "./Tabs";

const Settings = () => {
  const { user, updateUser } = useAuth();
  const setDashboardTab = useStore(s => s.setDashboardTab)
  const dashboardTab = useStore(s => s.dashboardTab)

  const [editUsername, toggleEditUsername] = useState(false);
  const [editBio, toggleEditBio] = useState(false);
  const [open, setOpen] = useState('');

  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  const { refs, floatingStyles } = useFloating({
    middleware: [
      flip(),
      shift()
    ],
    placement: 'top-end',
    strategy: 'absolute',
    transform: false
  });

  function handleEditUsername() {
    if (username && username !== user?.username)
      updateUser('username', username)

    toggleEditUsername(s => !s);
    setOpen('');
  }

  function handleEditBio() {
    if (bio && bio !== user?.bio)
      updateUser('bio', bio)

    toggleEditBio(s => !s);
    setOpen('');
  }

  const handleMenu = (menu: string) => { setDashboardTab(menu) }

  function toggleEmojiPicker(value: string) { setOpen(s => s !== value ? value : ''); }

  function handleEmojiInput(emoji: any) {
    if (open === 'username') setUsername(s => s.concat(emoji.native))
    else setBio(s => s.concat(emoji.native))
  }

  useEffect(() => {
    return () => {
      toggleEditUsername(false)
      toggleEditBio(false)
      setOpen('')
    }
  }, [dashboardTab])

  return (
    <>
      <div className="flex relative flex-col gap-10 text-sm w-full py-4 overflow-y-scroll z-50 no-scrollbar">
        <AnimatePresence>
          {
            open &&
            <div className="relative -mt-10 z-50">
              <motion.div
                variants={motionconfig.settings}
                initial='hidden'
                exit='hidden'
                animate='visible'
                className="w-5/6 h-56 bg-base-100 rounded-xl z-50 ml-5 mt-2"
                ref={refs.setFloating}
                style={{ ...floatingStyles }}
              >
                <EmojiPicker open={!!open} onEmojiSelect={handleEmojiInput} />
              </motion.div>
              <div onClick={() => toggleEmojiPicker('')} className="fixed inset-0 z-20 "></div>
            </div>
          }
        </AnimatePresence>

        {/* Profile */}
        <div className="flex flex-col">
          <Avatar size="140px" onlineIndication={false} />
        </div>

        {/* username */}
        <div className="grid relative px-4">
          <label className="text-sm text-primary" htmlFor="username">Username</label>
          <label className={`${editUsername ? 'border-b-primary' : 'border-b-transparent'} pl-0 bg-transparent border-b-2 rounded-none textarea relative flex items-center w-full gap-2 pr-16`}>
            {editUsername ?
              <>
                <TextArea onChange={(e) => setUsername(e.target.value)} value={username} className="text-nowrap" />
                <div className="flex gap-1 items-center absolute right-0">
                  <div
                    onClick={() => toggleEmojiPicker('username')}
                    ref={open === 'username' ? refs.setReference : undefined}
                    tabIndex={0}
                    className="flex btn btn-circle btn-ghost btn-xs "
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                    </svg>
                  </div>
                  <div onClick={handleEditUsername} tabIndex={0} className="btn btn-circle btn-ghost btn-xs ">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </>
              :
              <>
                <label className="" htmlFor="">{user?.username}</label>
                <div onClick={handleEditUsername} tabIndex={0} className="absolute right-0 btn btn-circle btn-ghost btn-xs ">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                </div>
              </>}
          </label>
        </div>

        {/* bio */}
        <div className="grid relative px-4">
          <label className="text-sm text-primary" htmlFor="About">About</label>
          <label className={`${editBio ? "border-b-primary" : 'border-b-transparent'} pl-0 bg-transparent border-b-2 rounded-none textarea relative flex justify-between w-full pr-16`}>
            {editBio ?
              <>
                <TextArea onChange={e => setBio(e.target.value)} value={bio} />
                <div className="flex gap-1 items-center absolute right-0">
                  <div onClick={() => toggleEmojiPicker('bio')} ref={open === 'bio' ? refs.setReference : undefined} tabIndex={0} className="btn btn-circle btn-ghost btn-xs ">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                    </svg>
                  </div>
                  <div onClick={handleEditBio} tabIndex={0} className="btn btn-circle btn-ghost btn-xs ">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
              </>
              :
              <>
                <p>{user?.bio} </p>
                <div onClick={handleEditBio} tabIndex={0} className="absolute right-0 btn btn-circle btn-ghost btn-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                </div>
              </>}
          </label>
        </div>

        <div className="w-full flex flex-col">
          {/* General Settings */}
          <div onClick={() => handleMenu('generalSettings')} tabIndex={0} className="hover:bg-[--base-400] w-full flex gap-4 items-center duration-200 px-4 py-4 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <label htmlFor="notification">General Settings</label>
            <div className="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
          <div className="w-full min-h-[2px] bg-gradient-to-r from-black/20 to-transparent" />

          {/* Blocked Contacts */}
          <div onClick={() => handleMenu('blockedContacts')} tabIndex={0} className="hover:bg-[--base-400] w-full flex gap-4 items-center duration-200 px-4 py-4 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <label htmlFor="notification">Blocked contacts</label>
            <div className="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="flex flex-col gap-6 w-full px-4">
          <div className="btn btn-primary flex gap-2 items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
            </svg>
            Logout
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings
