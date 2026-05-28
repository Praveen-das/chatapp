"use client";

import React from "react";
import { useE2eeStore } from "store/e2eStore";
import { ShieldCheckIcon, KeyIcon } from "@heroicons/react/24/outline";
import Header from "./SharedComponents/Header";

export default function SecuritySettings() {
  const hasCloudBackup = useE2eeStore((s) => s.hasCloudBackup);
  const setShowBackupModal = useE2eeStore((s) => s.setShowBackupModal);

  return (
    <div className="flex flex-col h-full">
      <Header title="Security & Encryption" mainTab="settings" />
      <div className="flex flex-col max-sm:gap-8 gap-10 text-sm w-full overflow-y-scroll no-scrollbar py-4">
        {/* Flat Section: Secure Recovery Backup */}
        <div className="grid gap-4 max-sm:px-0 px-4">
          <label className="text-sm text-primary">Recovery Settings</label>

          <div className="flex items-start justify-between gap-6 pl-2 py-2 border-b border-base-content/5 pb-4">
            <div className="flex flex-col gap-1.5 flex-1 pr-4">
              <span className="text-sm font-semibold text-base-content flex items-center gap-2">
                <ShieldCheckIcon
                  className={`w-5 h-5 shrink-0 ${hasCloudBackup ? "text-success" : "text-base-content/40"}`}
                />
                Recovery Key
              </span>
              <span className="text-xs text-base-content/60 leading-relaxed max-w-md">
                Your recovery key decrypts and restores your secure chat history. Keep it backed up in the cloud to
                access your chats on new devices.
              </span>
            </div>

            {/* Toggle Switch or Active Flag */}
            {hasCloudBackup ? (
              <div className="badge badge-success badge-outline text-[--black-white] text-xs font-bold py-2.5 px-3 rounded-full shrink-0 flex items-center gap-1.5 shadow-sm mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Active
              </div>
            ) : (
              <input
                type="checkbox"
                checked={false}
                onChange={() => setShowBackupModal(true)}
                className="toggle toggle-primary toggle-sm shrink-0 mt-1"
              />
            )}
          </div>
        </div>

        {/* Flat Section: Security Actions */}
        {hasCloudBackup && (
          <div className="grid gap-4 max-sm:px-0 px-4">
            <label className="text-sm text-primary">Security Controls</label>
            <div className="pl-2 py-2">
              <button
                type="button"
                onClick={() => setShowBackupModal(true)}
                className="btn btn-block md:w-auto btn-primary text-[--black-white]"
              >
                <KeyIcon className="size-5" />
                Change Recovery key
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
