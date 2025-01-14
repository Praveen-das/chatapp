"use client";
import React from "react";
import { useStore } from "../../../store/global";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";

function Header({
  title,
  mainTab,
  onClose,
}: {
  title: string;
  mainTab: string;
  onClose?:()=>void
}) {
  const setDashboardTab = useStore((s) => s.setDashboardTab);

  function handleClose(){
    onClose?.()
    setDashboardTab(mainTab)
  }

  return (
    <div className="flex justify-between items-center min-h-16">
      <div className="flex items-center gap-2">
        <label className=" text-xl font-bold" htmlFor="">
          {title}
        </label>
      </div>
      <button
        onClick={handleClose}
        className="btn btn-sm btn-ghost btn-circle "
      >
        <ChevronLeftIcon className="size-5" />
      </button>
    </div>
  );
}

export default Header;
