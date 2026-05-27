import _EmojiPicker from "@emoji-mart/react";
import { getEmojies } from "../../lib/emojies";
import chroma from "chroma-js";
import COLORS from "config/themes";
import { useTheme } from "@hooks/useTheme";

export default function EmojiPicker({ open, onEmojiSelect }: { open: boolean; onEmojiSelect: (emoji: any) => void }) {
  const { bgcolor } = useTheme();

  const rgb = chroma(bgcolor).rgb().join(",");

  return (
    <div
      style={{ "--rgb": rgb } as any}
      className={`${!open ? "hidden" : "mb-1"} [&>div>em-emoji-picker]:[--rgb-accent:var(--rgb)]`}
    >
      <_EmojiPicker
        className="bg-red-700"
        searchPosition="none"
        previewPosition="none"
        dynamicWidth
        emojiButtonSize={45}
        data={getEmojies}
        onEmojiSelect={onEmojiSelect}
      />
    </div>
  );
}
