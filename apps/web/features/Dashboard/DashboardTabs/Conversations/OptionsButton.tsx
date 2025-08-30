"use client";
import { useStore } from "store/global";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

export function OptionsButton() {
  const setDashboardTab = useStore((s) => s.setDashboardTab);

  return (
    <>
      <span onClick={(e) => setDashboardTab("settings")} tabIndex={0} className="btn btn-circle btn-ghost btn-sm">
        <Cog6ToothIcon className="size-5" />
      </span>
    </>
  );
}
