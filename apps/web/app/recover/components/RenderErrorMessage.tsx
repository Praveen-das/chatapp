"use client";

import { AnimatePresence, motion } from "framer-motion";

const motionError = {
  initial: { opacity: 0, y: -5 },
  exit: { opacity: 0, y: -5 },
  animate: { opacity: 1, y: 0 },
};

export default function RenderErrorMessage({ errorMessage }: { errorMessage?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      {errorMessage && (
        <motion.div {...motionError} className="text-sm text-error whitespace-nowrap">
          {errorMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
