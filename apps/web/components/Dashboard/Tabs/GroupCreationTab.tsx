"use client";
import React, { useState } from "react";
import { useStore } from "../../../store/global";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import TextArea from "../../ui/TextArea";
import { AnimatePresence, motion } from "framer-motion";
import EmojiPicker from "../../ChatWindow/components/ChatInput/EmojiPicker";
import { flip, shift, useFloating } from "@floating-ui/react";
import motionconfig from '../../../config/config'

const GroupCreationTab = () => {
  const setDashboardTab = useStore(s => s.setDashboardTab)

  const setSelectedGroupMembers = useStore(s => s.setSelectedGroupMembers);
  const selectedGroupMembers = useStore(s => s.selectedGroupMembers);
  const { sendGroupCreationRequest } = useSocket();
  const { user } = useAuth()

  const [displayName, setGroupName] = useState('');
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    middleware: [
      flip(),
      shift()
    ],
    placement: 'top-end',
    strategy: 'absolute',
    transform: false
  });

  const handleClose = () => {
    setSelectedGroupMembers(null);
    setDashboardTab('dashboard');
  };

  const handleSubmit = () => {
    selectedGroupMembers.push(user?.id!)
    sendGroupCreationRequest(displayName, selectedGroupMembers);
    handleClose();
  };

  function handleEmoji(e: any) {
    setGroupName(s => s.concat(e.native))
  }

  return (
    <>
      <div className="flex flex-col items-center py-8 h-full w-full">
        <AnimatePresence>
          {
            open &&
            <div className="w-full relative z-50">
              <motion.div
                variants={motionconfig.settings}
                initial='hidden'
                exit='hidden'
                animate='visible'
                className="w-5/6 h-56 bg-base-100 rounded-xl z-50 ml-5 mt-2"
                ref={refs.setFloating}
                style={{ ...floatingStyles }}
              >
                <EmojiPicker open={open} onEmojiSelect={handleEmoji} />
              </motion.div>
              <div onClick={() => setOpen(false)} className="fixed inset-0 z-20 "></div>
            </div>
          }
        </AnimatePresence>

        <div className="size-52 rounded-full bg-slate-600 flex items-center justify-center">
          <label className="text-xl text-wrap text-center" htmlFor="">Group icon</label>
        </div>
        <label className="form-control w-full max-w-sm my-auto">
          <div className="label">
            <span className="label-text">Group name</span>
          </div>
          <label className={`border-b-primary pl-0  pr-14 bg-transparent border-b-2 rounded-none textarea relative flex justify-center items-center w-full gap-2`}>
            <TextArea className='text-nowrap' onChange={(e) => setGroupName(e.target.value)} value={displayName} />
            <div className="flex gap-1 items-center absolute right-0">
              <div
                onClick={() => setOpen(true)}
                ref={refs.setReference}
                tabIndex={0}
                className="flex btn btn-circle btn-ghost btn-xs "
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                </svg>
              </div>
            </div>
          </label>

          {/* <input onChange={e => setGroupName(e.target.value)} type="text" placeholder="Group name" className="input rounded-2xl w-full " /> */}
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
  );
};

export default GroupCreationTab
