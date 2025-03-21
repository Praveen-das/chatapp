"use client";
import { CameraIcon } from "@heroicons/react/16/solid";
import { IMessage } from "@interfaces/messageInterface";
import { LinkIcon } from "@heroicons/react/24/solid";

export function DisplayRecentMessage({
  recentMessage,
  sender,
}: {
  recentMessage: IMessage;
  sender?: string;
}) {
  const messageString = recentMessage?.message||'';

  const messageType =
    recentMessage?.attachment?.type === "images"
      ? "Image"
      : recentMessage?.attachment?.type === "link"
        ? "Link"
        : "";

  const message = `${sender || "" + messageString || messageType || "This conversation is end to end encrypted"}`

  if (recentMessage?.deleted)
    return <div className="text-sm">This message is deleted</div>;
  return (
    <div className="flex items-center gap-2 text-sm font-light max-w-[90%] w-max text-left">
      <span className="tooltip tooltip-primary fixed" data-tip={message}/>
      {messageType && (
        <div>
          {messageType === "Image" ? (
            <CameraIcon className="size-4" />
          ) : messageType === "Link" ? (
            <LinkIcon className="size-4" />
          ) : ''}
        </div> 
      )}      
      <div title={message} className="truncate whitespace-pre-wrap line-clamp-1">
        {message}
      </div>
    </div>
  );
}
