"use client";
import React, { memo } from "react";
import { useStore } from "../../../../store/global";
import { useConversationStore } from "../../../../store/conversationStore";
import { ArchiveBoxArrowDownIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

function ArchiveMenu() {
  const setDashboardTab = useStore((s) => s.setDashboardTab);
  const conversations = useConversationStore((s) => s.conversations);

  const haveArchivedConv = conversations.some((c) => c.isArchived);

  return <AnimatePresence initial={false} mode="popLayout">
    {haveArchivedConv && (
      <motion.div
        layout
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
      >
        <button
          className="btn btn-sm btn-ghost btn-circle"
          onClick={() => setDashboardTab("archive")}
        >
          <ArchiveBoxArrowDownIcon className="size-5" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>;
}

export default memo(ArchiveMenu)
