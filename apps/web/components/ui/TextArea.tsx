import { TextareaHTMLAttributes, useState } from "react";
import useAutosizeTextArea from "../../hooks/useAutosizeTextArea";

function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const [textAreaRef, setTextAreaRef] = useState<HTMLTextAreaElement | null>(null);
    useAutosizeTextArea(textAreaRef, props.value);
    return <textarea maxLength={120} {...props} rows={1} ref={setTextAreaRef} className={`w-full resize-none bg-transparent outline-none no-scrollbar ${className ? className : ''}`} placeholder="Type here" />
}

export default TextArea