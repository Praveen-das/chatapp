"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import EmojiPicker from "./EmojiPicker";
import { flip, shift, useFloating } from "@floating-ui/react";
import motionconfig from "../../config/config";
import { FaceSmileIcon } from "@heroicons/react/24/outline";

export function Input({
  onChange,
  value,
  label,
}: {
  value: string;
  label?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    middleware: [flip(), shift()],
    placement: "top-end",
    strategy: "absolute",
    transform: false,
  });

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="w-full z-50 absolute">
            <motion.div
              variants={motionconfig.settings}
              initial="hidden"
              exit="hidden"
              animate="visible"
              className="w-5/6 h-56 bg-base-200 rounded-xl z-50 ml-5 mt-2"
              ref={refs.setFloating}
              style={{ ...floatingStyles }}
            >
              <EmojiPicker
                open={open}
                onEmojiSelect={(e) => onChange(value.concat(e.native))}
              />
            </motion.div>
            <div
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-20 "
            ></div>
          </div>
        )}
      </AnimatePresence>

      <label className="form-control w-full">
        {label && <span className="label-text text-primary">{label}</span>}
        <label
          className={`border-b-primary pl-0 pr-14 bg-transparent border-b-2 rounded-none textarea relative flex justify-center items-center w-full gap-2`}
        >
          <input
            className="w-full bg-transparent outline-none"
            onChange={(e) => onChange(e.target.value)}
            value={value}
            placeholder="Type here..."
          />

          <div className="flex gap-1 items-center absolute right-0">
            <div
              onClick={() => setOpen(true)}
              ref={refs.setReference}
              tabIndex={0}
              className="flex btn btn-circle btn-ghost btn-xs "
            >
              <FaceSmileIcon className="size-5" />
            </div>
          </div>
        </label>
      </label>
    </>
  );
}
