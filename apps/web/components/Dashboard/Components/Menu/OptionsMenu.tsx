"use client";
import { memo, useMemo } from "react";
import Menu from "@components/ui/Menu";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useStore } from "store/global";

function OptionsMenu() {
  const setDashboardTab = useStore((s) => s.setDashboardTab);

  const options = useMemo(
    () => [
      { label: "New Chat", handler: () => setDashboardTab("contacts") },
      {
        label: "New Group",
        handler: () => setDashboardTab("addMembersToGroup"),
      },
      { label: "Settings", handler: () => setDashboardTab("settings") },
    ],
    []
  );
  return <Menu
    buttonIcon={<span className="btn btn-circle btn-ghost btn-sm">
      <EllipsisVerticalIcon className="size-6" />
    </span>}
    menuItems={options}
    placement="bottom-end" />;
}

export default memo(OptionsMenu)
