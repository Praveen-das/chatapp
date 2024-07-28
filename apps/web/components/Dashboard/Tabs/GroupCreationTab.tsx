"use client";
import React, { useState } from "react";
import { useStore } from "../../../store/global";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { useTabs } from "./Tabs";

const GroupCreationTab = () => {
  const setDashboardTab = useStore(s => s.setDashboardTab)

  const setSelectedGroupMembers = useStore(s => s.setSelectedGroupMembers);
  const selectedGroupMembers = useStore(s => s.selectedGroupMembers);
  const { sendGroupCreationRequest } = useSocket();
  const { user } = useAuth()

  const [displayName, setGroupName] = useState('');

  const handleClose = () => {
    setSelectedGroupMembers(null);
    setDashboardTab('dashboard');
  };

  const handleSubmit = () => {
    selectedGroupMembers.push(user?.id!)
    sendGroupCreationRequest(displayName, selectedGroupMembers);
    handleClose();
  };

  return (
    <>
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
  );
};

export default GroupCreationTab
