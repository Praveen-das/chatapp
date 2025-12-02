import useAutosizeTextArea from "@hooks/useAutosizeTextArea";
import { TextareaHTMLAttributes } from "react";

function TextArea({ className, value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const textareaRef = useAutosizeTextArea(value as any, 100);

  return (
    <textarea
      {...props}
      ref={textareaRef}
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
