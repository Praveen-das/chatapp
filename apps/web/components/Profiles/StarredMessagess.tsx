"use client";

import { Fragment, useState } from "react";
import { useAttachments } from "../../store/attachments";
import { useStore } from "../../store/global";
import { useTabs } from "../ui/Tab/Tabs";
import Link from "next/link";
import LinkPreview from "../ui/LinkPreview";
import { parseUrl } from "@lib/utils";
import DisplayProfileWrapper from "./DisplayProfileWrapper";
import {
  IUserConversation,
  IGroupConversation,
  IConversation,
} from "../../interfaces/conversationInterface";
import {
  IImageAttachment,
  IUrlAttachment,
} from "../../interfaces/messageInterface";
import Image from "next/image";
import Chat from "@components/ChatWindow/components/ChatArea/Chat";
import Avatar from "@components/ui/Avatar";
import moment from "moment";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { IUser } from "@interfaces/userInterface";
import useMediaQuery from "@hooks/useMediaQuery";

function findParticipants(
  conversation: IConversation,
  from: string,
  to: string
) {
  let sender = null;
  let receiver = null;

  for (let member of conversation.members) {
    if (member.id === conversation.userId) member.self = true;
    if (member.id === from) sender = member;
    if (member.id === to) receiver = member;
    if (sender && receiver) break;
  }

  return { sender, receiver };
}

const formatName = (member: IUser) =>
  member?.self ? "You" : member?.username || "Unknown";

function StarredMessagess({ conversation }: { conversation: IConversation }) {
  const { initialTab } = useTabs();
  const setProfileTab = useStore((s) => s.setProfileTab);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const setReplyMessageId = useStore((s) => s.setReplyMessageId);
  const isLg = useMediaQuery("(min-width: 1024px)");

  const messages = conversation.starred;

  const handleShowingReply = (id:string)=>{
    setReplyMessageId(id)
    !isLg && toggleProfile(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="min-h-16 w-full flex items-center gap-4 px-4">
        <button
          onClick={() => setProfileTab(initialTab)}
          className={`btn btn-sm btn-ghost btn-circle`}
        >
          <ArrowRightIcon className="size-5" />
        </button>
        <label htmlFor="contact info">Starred Messages</label>
      </div>
      <div className="flex flex-col w-full h-full bg-gradient-to-t from-base-200 overflow-y-auto no-scrollbar">
        {messages?.map((chat, i) => {
          if (!chat) return;
          let { sender, receiver } = findParticipants(
            conversation,
            chat.from!,
            chat.to
          );

          let messageFlow = `${formatName(sender!)} -> ${formatName(receiver!)}`;
          let timestamp = moment(new Date(chat.timestamp)).format("dddd");

          return (
            <div key={chat.id} onClick={()=>handleShowingReply(chat.id)} className="flex justify-between hover:bg-black/25 pl-4 cursor-pointer">
              <div className="py-2">
                <Avatar
                  url={sender?.profilePicture}
                  size="30px"
                  onlineIndication={false}
                />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between mt-2 pb-2 ml-4 mr-4 text-xs border-b-[1px] border-b-black/25">
                  {messageFlow}
                  <span>{timestamp}</span>
                </div>
                <div>
                  <Chat
                    noColorChange
                    chat={chat}
                    self={false}
                    canSelect
                    style={{ pointerEvents: "none" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StarredMessagess;
