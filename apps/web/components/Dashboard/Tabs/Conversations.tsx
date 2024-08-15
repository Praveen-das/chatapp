"use client";
import useSocket from "../../../context/SocketProvider";
import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import socket from "../../../lib/ws";
import { useStore } from "../../../store/global";
import GroupConversation from "../Components/GroupConversation";
import Conversation from "../Components/Conversation";
import { useMessageStore } from "../../../store/messageStore";
import { useConversationStore } from "../../../store/conversationStore";
import SearchUser from "../Components/SearchUser";

export default function Conversations() {
  const conversations = useConversationStore(s => s.conversations);
  const selectedConversation = useConversationStore(s => s.selectedConversation);

  const [query, setQuery] = useState('')

  const queryResult = useMemo(() => {
    if (!query) return []
    return conversations.filter(conversation => conversation.displayName?.includes(query))
  }, [query, conversations])

  useMemo(() => conversations.sort((a, b) => b?.recentMessage?.timestamp! - a?.recentMessage?.timestamp!), [conversations])

  return (
    <>
      <SearchUser onChange={setQuery} />
      <div className='flex h-full w-full flex-col mt-4 gap-2 overflow-y-scroll no-scrollbar'>
        {
          (query ? queryResult : conversations).map((conversation) =>
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
    </>

  );

}


