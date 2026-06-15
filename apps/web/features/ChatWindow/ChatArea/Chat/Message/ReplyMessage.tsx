"use client";
import { IMessageReply } from "@repo/interfaces/messageInterface";
import useAuth from "@hooks/useAuth";
import { PhotoIcon } from "@heroicons/react/16/solid";
import {  getUserById } from "@lib/conversation";
import { E2E_WAITING_MESSAGE } from "@lib/e2e";

export function ReplyMessage({ reply, onClick }: { reply: IMessageReply; onClick: () => void }) {
  if (!reply) return null;

  const { user } = useAuth();
  const replyAttachment = reply.attachment;
  const sender = getUserById(reply.userId);
  const self = user?.id === sender?.id;
  
  const messageString = reply.message === E2E_WAITING_MESSAGE ? "⏳ Waiting for this message..." : reply.message;

  return (
    <div
      onClick={onClick}
      className={`relative flex rounded-xl ${self ? "bg-black/20" : "bg-white/10"} mb-1 z-3 overflow-hidden cursor-pointer`}
    >
      {replyAttachment?.type === "images" && (
        <img className="h-20 rounded-md" src={replyAttachment.thumbnailUrl} alt="" />
      )}
      <div className="flex flex-col gap-[2px] py-2 pl-2 pr-4">
        <label className="text-xs" htmlFor="">
          {self ? "You" : sender?.username}
        </label>
        <p className="flex items-center gap-1 text-sm break-all line-clamp-2 pointer-events-none">
          {messageString || (
            <>
              {replyAttachment?.type === "images" && <PhotoIcon className="size-4" />}
              Image
            </>
          )}
        </p>
      </div>
      {replyAttachment?.type === "link" && replyAttachment.metadata && (
        <img className="w-32" src={replyAttachment.metadata.image} alt="" />
      )}
    </div>
  );
}
