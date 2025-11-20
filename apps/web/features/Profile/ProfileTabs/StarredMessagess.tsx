"use client";

import { useStore } from "../../../store/global";
import { IConversation } from "@repo/interfaces/conversationInterface";
import Avatar from "@features/ui/Avatar";
import moment from "moment";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { IUser } from "@repo/interfaces/userInterface";
import useMediaQuery from "@hooks/useMediaQuery";
import Chat from "@features/ChatWindow/ChatArea/Chat/Chat";
import { scrolleToIndexHelper } from "@lib/events";
import useSelectedConversation from "@hooks/useSelectedConversation";
import { getUserFromMetadata } from "@lib/conversation";

function findParticipants(conversation: IConversation, from: string, to: string) {
  let sender = null;
  let receiver = null;

  if (conversation.host === "system") return { sender: null, receiver: null };

  for (let meta of conversation.members) {
    const member = getUserFromMetadata(meta)!;
    if (member.id === conversation.userId) member.self = true;
    if (member.id === from) sender = member;
    if (member.id === to) receiver = member;
    if (sender && receiver) break;
  }

  return { sender, receiver };
}

const formatName = (member: IUser) => (member?.self ? "You" : member?.username || "Unknown");

function StarredMessagess() {
  const conversation = useSelectedConversation();

  if (!conversation) return;

  const profileTab = useStore((s) => s.profileTab);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const isLg = useMediaQuery("(min-width: 1024px)");

  const messages = conversation.starred;

  const handleShowingReply = (id: string) => {
    scrolleToIndexHelper(id);
    !isLg && toggleProfile(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="min-h-16 w-full flex items-center gap-4 px-4">
        <button onClick={() => profileTab.back()} className={`btn btn-sm btn-ghost btn-circle`}>
          <ArrowRightIcon className="size-5" />
        </button>
        <label htmlFor="contact info">Starred Messages</label>
      </div>
      <div className="flex flex-col w-full h-full bg-gradient-to-t from-base-200 overflow-y-auto no-scrollbar">
        {messages?.map((chat, i) => {
          if (!chat) return;
          let { sender, receiver } = findParticipants(conversation, chat.from!, chat.to!);

          let userMessageFlow = `${formatName(sender!)} -> ${formatName(receiver!)}`;
          let groupMessageFlow = `${formatName(sender!)}`;
          let timestamp = moment(new Date(chat.timestamp)).format("dddd");

          return (
            <div
              key={chat.id}
              onClick={() => handleShowingReply(chat.id)}
              className="flex justify-between hover:bg-black/25 pl-4 cursor-pointer"
            >
              <div className="py-2">
                <Avatar url={sender?.profilePicture} size="30px" onlineIndication={false} />
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between mt-2 pb-2 ml-4 mr-4 text-xs border-b-[1px] border-b-black/25">
                  {conversation.host === "user" ? userMessageFlow : groupMessageFlow}
                  <span>{timestamp}</span>
                </div>
                <div>
                  <Chat noColorChange chat={chat} self={false} canSelect style={{ pointerEvents: "none" }} />
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
