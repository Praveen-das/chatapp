import { generateRelatedColors } from "@lib/theme";
import { Check, Plus, Xmark } from "iconoir-react";
import { useTheme } from "next-themes";
import React, { useState } from "react";

interface ITags {
  onSubmit?: (tag: string) => void;
  onDelete?: (tag: string) => void;
  tags: string[];
  canEdit?: boolean;
  showLabel?: boolean;
}

function TagInput({
  tags,
  onSubmit,
  onDelete,
  showLabel = true,
  canEdit = false,
}: ITags) {
  const { theme } = useTheme();
  const [editTags, toggleEditTags] = useState(false);
  const [tag, setTag] = useState("");

  function handleAddingTag() {
    toggleEditTags((s) => !s);
    if (!tag) return;

    onSubmit?.(tag);
    setTag("");
  }

  function handleRemovingTag(t: string) {
    onDelete?.(t);
  }

  return (
    <div className="grid relative">
      {showLabel && (
        <label className="text-sm text-primary" htmlFor="About">
          Tags
        </label>
      )}

      <div className="min-h-8 flex items-center gap-2 flex-wrap">
        {canEdit &&
          (editTags ? (
            <div className="flex gap-2 items-center">
              <div
                className={`duration-200 ${!tag ? "before:pointer-events-none before:content-['Type_here..'] text-white/25 text-sm" : "focus:before:content-none"} outline-none px-2 py-1 rounded-lg bg-base-200`}
                onInput={(e) => setTag(e.currentTarget.textContent!)}
                contentEditable
                suppressContentEditableWarning
              />

              {!tag ? (
                <div
                  className="btn btn-xs btn-circle"
                  onClick={() => toggleEditTags(false)}
                >
                  <Xmark />
                </div>
              ) : (
                <div
                  className="btn btn-xs btn-circle"
                  onClick={handleAddingTag}
                >
                  <Check />
                </div>
              )}
            </div>
          ) : !!tags?.length ? (
            <div
              className="btn btn-circle btn-xs"
              onClick={() => toggleEditTags((s) => !s)}
            >
              <Plus />
            </div>
          ) : (
            <div
              onClick={() => toggleEditTags((s) => !s)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Plus />
              Add tags
            </div>
          ))}

        {tags?.map((tag, index) => {
          const bg = generateRelatedColors(`#${theme?.split("-")[1]}`, 5)[
            index
          ];

          return (
            <div
              key={tag + index}
              style={{ background: bg }}
              className={`px-2 py-1 rounded-lg text-xs ${canEdit ? "cursor-pointer hover:line-through" : ""}`}
              onClick={() => canEdit && handleRemovingTag(tag)}
            >
              {tag}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TagInput;
