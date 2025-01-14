"use client";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTabs } from "./Tabs";

const Tab = ({
  children,
  component,
  onExitComplete,
}: {
  children: React.ReactNode;
  component: string;
  onExitComplete?: () => void;
}) => {
  const { direction, activeTab } = useTabs();
  const open = Boolean(activeTab === component);
  const _direction = direction === "ltr" ? "left" : "right";

  let container: any = {
    hidden: {
      opacity: 0,
      [_direction]: "-200px",
      pointerEvents: "none",
      // zIndex: 0,
    },
    visible: {
      opacity: 1,
      [_direction]: "0px",
      pointerEvents: "all",
      // zIndex: 1,
    },
  };

  return (
    <AnimatePresence onExitComplete={onExitComplete} initial={false}>
      {open && (
        <motion.div
          variants={container}
          initial="hidden"
          animate={"visible"}
          exit="hidden"
          className={`absolute top-0 w-full h-full ${open ? "z-40" : "z-0"}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Tab;
