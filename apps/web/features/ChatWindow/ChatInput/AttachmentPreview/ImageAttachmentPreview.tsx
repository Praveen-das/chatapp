import { PhotoIcon } from "@heroicons/react/16/solid";
import { IMessageReply } from "@interfaces/messageInterface";
import { decrypt } from "@lib/e2e";
import React from "react";

function ImageAttachmentPreview({
  url,
  receiver,
  text,
}: {
  url: string;
  receiver: string;
  text: string|null;
}) {
  
  return (
    <>
      <img className="h-36 rounded-lg" src={url} />
      <div className={`w-full h-full grid p-2 gap-1`}>
        <span className="text-xs text-primary">{receiver}</span>
        <div className="flex gap-1 text-sm items-center">
          <PhotoIcon className="size-4" />
          <span className="truncate flex-1 w-0 pr-10">
            {text ? text : "Image"}
          </span>
        </div>
      </div>
    </>
  );
}

export default ImageAttachmentPreview;
