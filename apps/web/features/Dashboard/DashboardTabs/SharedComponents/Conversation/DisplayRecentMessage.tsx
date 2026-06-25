"use client";
import { CameraIcon } from "@heroicons/react/16/solid";
import { IMessage } from "@repo/interfaces/messageInterface";
import { LinkIcon } from "@heroicons/react/24/solid";

import { E2E_WAITING_MESSAGE, E2E_WAITING_DISPLAY, E2E_ENCRYPTED_PLACEHOLDER, MESSAGE_DELETED_DISPLAY } from "@lib/e2e";

export function DisplayRecentMessage({
  recentMessage,
  sender,
  host,
}: {
  recentMessage: IMessage;
  sender?: string;
  host: string;
}) {
  const rawMessage = recentMessage?.message || "";

  const messageType =
    recentMessage?.attachment?.type === "images" ? "Image" : recentMessage?.attachment?.type === "link" ? "Link" : "";

  const content = rawMessage === E2E_WAITING_MESSAGE
    ? E2E_WAITING_DISPLAY
    : rawMessage || messageType || (host === "user" ? E2E_ENCRYPTED_PLACEHOLDER : "");
  const message = sender ? `${sender}: ${content}` : content;

  if (recentMessage?.type === "message" && recentMessage?.deleted)
    return <div className="text-[13px] text-base-content/40 italic">{MESSAGE_DELETED_DISPLAY}</div>;

  return (
    <div className="flex items-center gap-1.5 text-[13px] opacity-70 font-normal max-w-[95%] w-max text-left text-current">
      <span className="tooltip tooltip-primary fixed" data-tip={message} />
      {messageType && (
        <div className="shrink-0">
          {messageType === "Image" ? (
            <CameraIcon className="size-3.5 text-primary opacity-80" />
          ) : messageType === "Link" ? (
            <LinkIcon className="size-3.5 text-primary opacity-80" />
          ) : (
            ""
          )}
        </div>
      )}
      <div title={message} className="truncate whitespace-pre-wrap line-clamp-1">
        {message}
      </div>
    </div>
  );
}
