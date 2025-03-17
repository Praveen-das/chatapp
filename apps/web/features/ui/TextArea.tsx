import { ChangeEvent, TextareaHTMLAttributes, useCallback, useEffect, useRef, useState } from "react";

const adjustHeight = (elm: EventTarget & HTMLTextAreaElement) => {
  elm.style.height = "0px";
  const scrollHeight = elm.scrollHeight;
  if (scrollHeight < 100) elm.style.height = scrollHeight + "px";
};

function TextArea({ className, value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement | null>(null);


  useEffect(() => {
    if (ref.current) {
      adjustHeight(ref.current);
      ref.current.oninput = () => {
        adjustHeight(ref.current!);
      };
    }
  }, []);

  return (
    <textarea
      {...props}
      ref={ref}
      value={value}
      onLoadedData={console.log}
      maxLength={120}
      rows={1}
      className={`w-full resize-none bg-transparent outline-none no-scrollbar ${className ? className : ""}`}
      placeholder="Type here"
    />
  );
}

export default TextArea;
