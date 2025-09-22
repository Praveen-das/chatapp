"use client";
import ChatWindow from "@features/ChatWindow/ChatWindow";
import Dashboard from "@features/Dashboard";
import GroupInvitation from "@features/GroupInvitation/GroupInvitation";
import LoadingPage from "@features/ui/LoadingPage";
import { Suspense, useEffect } from "react";

export default function DashboardClient() {
  return (
    <div className="flex relative w-full h-screen max-sm:py-0 p-4 sm:gap-4 bg-[--base-300-100]">
      <GroupInvitation />
      <Suspense fallback={<LoadingPage />}>
        <Dashboard />
      </Suspense>
      <ChatWindow />
    </div>
  );
}
