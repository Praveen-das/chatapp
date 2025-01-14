"use client";
import { useMemo, useState } from "react";
import GroupConversation from "../../components/GroupConversation";
import UserConversation from "../../components/UserConversation";
import { useConversationStore } from "../../../../store/conversationStore";
import SearchUser from "../../../ui/Searchbar";
import MainHeader from "./Header";
import Menu_Conversation from "../../components/MenuContext";

export default function Conversations() {
  const conversations = useConversationStore((s) => s.conversations);
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );

  const [query, setQuery] = useState("");

  const queryResult = useMemo(() => {
    if (!query) return [];
    return conversations.filter((conversation) =>
      conversation.displayName?.includes(query)
    );
  }, [query, conversations]);

  useMemo(
    () => conversations.sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations]
  );

  return (
    <div className="flex flex-col max-sm:gap-2 sm:gap-4 h-full">
      <MainHeader />
      <Menu_Conversation />
      <SearchUser onChange={setQuery} />
      <div className="flex flex-col overflow-hidden">
        <div className="flex flex-1 h-full w-full flex-col mt-4 gap-2 overflow-y-scroll no-scrollbar">
          {(query ? queryResult : conversations).map(
            (conversation) =>
              !conversation.archived &&
              (conversation.host === "user" ? (
                conversation.active && (
                  <UserConversation
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={
                      selectedConversation?.conversationId ===
                      conversation.conversationId
                    }
                  />
                )
              ) : (
                <GroupConversation
                  key={conversation.id}
                  conversation={{ ...conversation }}
                  isSelectedGroup={
                    selectedConversation?.conversationId ===
                    conversation.conversationId
                  }
                />
              ))
          )}
        </div>
      </div>
    </div>
  );
}
