"use client";
import React from "react";
import { useStore } from "../../../store/global";
import { useTabs } from "../Tabs/Tabs";

function SecondaryHeader({ title, mainTab }: { title: string, mainTab: string }) {
  const setDashboardTab = useStore(s => s.setDashboardTab)

  return (
    <div className='flex justify-between items-center min-h-16'>
      <div className="flex items-center gap-2">
        <label className=' text-xl font-bold' htmlFor="">{title}</label>
      </div>
      <button onClick={() => setDashboardTab(mainTab)} className='btn btn-sm btn-ghost btn-circle '>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default SecondaryHeader
