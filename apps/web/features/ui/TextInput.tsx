import React, { TextareaHTMLAttributes, useEffect, useState } from "react";
import { flip, shift, useFloating } from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, EditPencil, Emoji, Plus, Trash, Xmark } from "iconoir-react";
import motionconfig from "../../config/config";
import TextArea from "./TextArea";
import EmojiPicker from "./EmojiPicker";

interface ITextInput {
  text: string;
  className?: string;
  placeholderText: string;
  label?: string;
  autoRaw?: boolean;
  canEdit?: boolean;

  onSubmit: (text: string) => void;
  onDelete?: (text: string) => void;
}

function TextInput({
  text,
  className = "",
  label,
  onSubmit,
  onDelete,
  placeholderText,
  autoRaw = false,
  canEdit = true,
}: ITextInput) {
  const [edit, toggleEdit] = useState(false);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState("");

  const { refs, floatingStyles } = useFloating({
    middleware: [flip(), shift()],
    placement: "top-end",
    strategy: "absolute",
    transform: false,
  });

  function toggleEmojiPicker(value: string) {
    setOpen((s) => (s !== value ? value : ""));
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) {
    setValue(e.target.value);
  }

  function handleSubmit() {
    onSubmit(value);
    setValue("");
    toggleEdit(false);
  }

  function handleEmojiInput(emoji: any) {
    setValue((s) => s.concat(emoji.native));
  }

  useEffect(() => {
    setValue(text);
  }, [text, edit]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              variants={motionconfig.settings}
              initial="hidden"
              exit="hidden"
              animate="visible"
              className="w-5/6 h-56 bg-base-200 rounded-xl z-50 ml-5 mt-2"
              ref={refs.setFloating}
              style={{ ...floatingStyles }}
            >
              <EmojiPicker open={!!open} onEmojiSelect={handleEmojiInput} />
            </motion.div>
            <div onClick={() => toggleEmojiPicker("")} className="fixed inset-0 z-20"></div>
          </>
        )}
      </AnimatePresence>
      {/* max-sm:px-0 px-4 */}

      <div className="flex flex-col relative gap-2">
        {label && (
          <label className="text-sm text-primary" htmlFor="About">
            {label}
          </label>
        )}
        <label
          className={`leading-6 ${edit ? "border-b-primary" : "border-b-transparent"} px-0 bg-transparent border-b-2 rounded-none py-1 relative flex justify-between gap-4 w-full`}
        >
          {edit ? (
            <>
              {autoRaw ? (
                <TextArea onChange={handleChange} value={value} />
              ) : (
                <input className="w-full bg-transparent outline-none" onChange={handleChange} value={value} />
              )}
              <div className={`flex gap-1 ml-auto`}>
                <div
                  onClick={() => toggleEmojiPicker("bio")}
                  ref={open === "bio" ? refs.setReference : undefined}
                  tabIndex={0}
                  className="btn btn-circle btn-ghost btn-xs "
                >
                  <Emoji />
                </div>
                <div onClick={handleSubmit} tabIndex={0} className="btn btn-circle btn-ghost btn-xs ">
                  <Check />
                </div>
              </div>
            </>
          ) : text ? (
            <>
              <p className={`whitespace-pre-wrap break-all ${className}`}>{text}</p>
              {canEdit && (
                <div className="flex gap-1 items-center mb-auto">
                  {onDelete && (
                    <div onClick={() => onDelete("")} tabIndex={0} className="btn btn-circle btn-ghost btn-xs">
                      <Trash />
                    </div>
                  )}
                  <div onClick={() => toggleEdit((s) => !s)} tabIndex={0} className="btn btn-circle btn-ghost btn-xs">
                    <EditPencil />
                  </div>
                </div>
              )}
            </>
          ) : canEdit ? (
            <div onClick={() => toggleEdit((s) => !s)} className="flex items-center gap-2 cursor-pointer">
              <Plus />
              {placeholderText}
            </div>
          ) : null}
        </label>
      </div>
    </>
  );
}

export default TextInput;
