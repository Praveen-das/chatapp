"use client";
import { useSocket } from "../../context/SocketProvider";
import React, { Fragment, useCallback, useEffect } from "react";
import socket from "../../lib/ws";
import { useStore } from "../../store/global";
import GroupConversation from "./components/GroupConversation";
import Conversation from "./components/Conversation";
import { useMessages } from "../../store/messageStore";

export default function Conversations() {
  const conversations = useMessages(s => s.conversations);
  const selectedConversation = useStore(s => s.selectedConversation);

  conversations.sort((a, b) => b?.recentMessage?.timestamp! - a?.recentMessage?.timestamp!)

  return (
    <div className='flex h-full w-full flex-col mt-4 gap-2 overflow-y-scroll no-scrollbar'>
      {
        conversations.map((conversation) =>
          conversation.host === 'user' ?
            <Conversation
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversation?.id === conversation.id}
            />
            :
            <GroupConversation
              key={conversation.id}
              conversation={conversation as IGroupConversation}
              isSelectedGroup={selectedConversation?.id === conversation.id}
            />
        )
      }
    </div>

  );

}


