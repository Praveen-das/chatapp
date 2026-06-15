"use client";
import { useConversationStore } from "../../../../store/conversationStore";
import { useStore } from "store/global";
import { AnimatePresence, motion } from "framer-motion";
import { ArchiveBoxArrowDownIcon } from "@heroicons/react/24/outline";

export function ArchiveButton() {
  const setDashboardTab = useStore((s) => s.setDashboardTab);
  const conversations = useConversationStore((s) => s.conversations);

  const haveArchivedConv = conversations.some((c) => conversations.length === 1 ? c.archived && c.active : c.archived
  );

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {haveArchivedConv && (
        <motion.div
          layout
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <button className="btn btn-sm btn-ghost btn-circle" onClick={() => setDashboardTab("archive")}>
            <ArchiveBoxArrowDownIcon className="size-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
