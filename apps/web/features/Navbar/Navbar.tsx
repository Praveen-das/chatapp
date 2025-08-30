"use client";
import Avatar from "@features/ui/Avatar";
import useAuth from "@hooks/useAuth";
import { useSession } from "next-auth/react";
import React from "react";
import BrandLogo from "public/logo.svg";
import { CreateGroupButton } from "@features/Dashboard/DashboardTabs/Conversations/CreateGroupButton";
import { NewChatButton } from "@features/Dashboard/DashboardTabs/Conversations/NewChatButton";
import { ArchiveButton } from "@features/Dashboard/DashboardTabs/Conversations/ArchiveButton";
import { OptionsButton } from "@features/Dashboard/DashboardTabs/Conversations/OptionsButton";

export default function Navbar() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col justify-between items-center min-w-14 h-full rounded-2xl p-3 py-4 bg-[--base-200-300]">
      <h1 className="text-2xl text-primary font-black">M</h1>
      <div className="flex flex-col gap-4 mb-4 mt-auto">
        <CreateGroupButton />
        <NewChatButton />
        <ArchiveButton />
        <OptionsButton />
      </div>
      <Avatar url={user?.profilePicture} onlineIndication={false} size="30px" />
    </div>
  );
}
