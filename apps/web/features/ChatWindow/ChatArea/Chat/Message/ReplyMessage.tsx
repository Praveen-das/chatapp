"use client";
import React from "react";
import { IMessageReply } from "@interfaces/messageInterface";
import useAuth from "@hooks/useAuth";
import { PhotoIcon } from "@heroicons/react/16/solid";
import { decrypt } from "@lib/e2e";
import { useConversationStore } from "store/conversationStore";

export function ReplyMessage({
  reply, onClick,
}: {
  reply: IMessageReply;
  onClick: () => void;
}) {
  if(!reply) return null
  const user = useAuth.getState().user;
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );
  const replyAttachment = reply.attachment;
  const sender = selectedConversation?.members.find(
    (m) => m.id === reply.userId
  );
  const self = user?.id === sender?.id;
  const messageString = reply.message ? decrypt(reply.message) : null;

  return (
    <div
      onClick={onClick}
      className={`relative flex rounded-xl ${self ? "bg-black/20" : "bg-white/10"} mb-1 z-3 overflow-hidden cursor-pointer`}
    >
      {replyAttachment?.type === "images" && (
        <img
          className="h-20 rounded-md"
          src={replyAttachment.thumbnailUrl}
          alt="" />
      )}
      <div className="flex flex-col gap-[2px] py-2 pl-2 pr-4">
        <label className="text-xs" htmlFor="">
          {self ? "You" : sender?.username}
        </label>
        <p className="flex items-center gap-1 text-sm break-all line-clamp-2 pointer-events-none">
          {messageString || (
            <>
              {replyAttachment?.type === "images" && (
                <PhotoIcon className="size-4" />
              )}
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
