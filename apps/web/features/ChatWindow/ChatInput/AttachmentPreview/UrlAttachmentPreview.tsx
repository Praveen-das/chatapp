import { PhotoIcon } from "@heroicons/react/16/solid";
import { IMessageReply, IUrlAttachment, IUrlMetadata } from "@repo/interfaces/messageInterface";
import React from "react";

function UrlAttachmentPreview({
  metadata,
  receiver,
  text,
}: {
  metadata?: IUrlMetadata | null;
  receiver: string;
  text: string | null;
}) {

  return (
    <>
      {metadata && <img className="h-36 rounded-lg" src={metadata.image} />}
      <div
        className={`w-full h-full grid p-2 gap-2 ${!metadata ? "my-2" : ""}`}
      >
        <span className="text-xs text-primary">{receiver}</span>
        {metadata && (
          <>
            <label className="truncate" htmlFor="">
              {metadata.title}
            </label>
            <label className="line-clamp-2 text-xs" htmlFor="">
              {metadata.description}
            </label>
          </>
        )}
        <div className={`flex gap-1 text-sm items-center mt-auto`}>
          <PhotoIcon className="size-4" />
          <span className="truncate flex-1 w-0 pr-10">
            {text ? text : "Image"}
          </span>
        </div>
      </div>
    </>
  );
}

export default UrlAttachmentPreview;
