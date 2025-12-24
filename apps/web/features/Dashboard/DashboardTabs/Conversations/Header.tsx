"use client";
import { memo, useEffect, useState } from "react";
import { useMessageStore } from "../../../../store/messageStore";
import { useConversationStore } from "../../../../store/conversationStore";
import { CreateGroupButton } from "./CreateGroupButton";
import { ArchiveButton } from "./ArchiveButton";
import { NewChatButton } from "./NewChatButton";
import { OptionsButton } from "./OptionsButton";
import { AiButton } from "./AiButton";

function Header() {
  const unreadMessages = useMessageStore((s) => s.unreadMessages);
  const selectedConversation = useConversationStore((s) => s.selectedConversation);

  const [totalMessages, setTotalMessages] = useState(0);

  useEffect(() => {
    let total = 0;

    unreadMessages.forEach((um, key) => {
      if (selectedConversation?.id === key) return;
      total += um.length;
    });

    setTotalMessages(total);
  }, [unreadMessages, selectedConversation]);

  return (
    <>
      <div className="min-h-16 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* <h1 className="text-2xl text-primary font-black">M</h1> */}
          <label className="text-xl font-bold" htmlFor="">
            Chats
          </label>
          {totalMessages > 0 ? (
            <span className="flex items-center justify-center text-white rounded-full text-xs w-[20px] h-[20px] bg-primary">
              {totalMessages}
            </span>
          ) : (
            <span />
          )}
        </div>
        <div className="flex items-center gap-4">
          <AiButton />
          <CreateGroupButton />
          <NewChatButton />
          <ArchiveButton />
          <OptionsButton />
        </div>
      </div>
    </>
  );
}

export default memo(Header);
