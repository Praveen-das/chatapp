import { TextareaHTMLAttributes, useEffect, useRef, useState } from "react";

function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.onchange = (e) => {
        if(!textAreaRef.current) return
        textAreaRef.current.style.height = "0px";
        const scrollHeight = textAreaRef.current.scrollHeight;
        textAreaRef.current.style.height = scrollHeight + "px";
      };
    }
  }, []);

  return (
    <textarea
    {...props}
      maxLength={120}
      rows={1}
      ref={textAreaRef}
      className={`w-full resize-none bg-transparent outline-none no-scrollbar ${className ? className : ""}`}
      placeholder="Type here"
    />
  );
}

export default TextArea;
