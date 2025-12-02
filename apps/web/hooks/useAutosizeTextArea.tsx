import { useEffect, useRef } from "react";

export default function useAutosizeTextArea(value: string, maxHeight = 75) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  }, [value]);

  return ref;
}
