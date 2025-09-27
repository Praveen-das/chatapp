import ChatWindow from "@features/ChatWindow/ChatWindow";
import Dashboard from "@features/Dashboard";
import { useState } from "react";

export default function DashboardClient() {
  useState()
  return (
    <div className="flex relative w-full h-screen max-sm:py-0 p-4 sm:gap-4 bg-[--base-300-100]">
      <Dashboard />
      <ChatWindow />
    </div>
  );
}
