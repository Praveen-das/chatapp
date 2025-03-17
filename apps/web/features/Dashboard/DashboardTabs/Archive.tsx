import Conversation from "./SharedComponents/Conversation/Conversation";
import React from "react";
import { useConversationStore } from "store/conversationStore";
import GroupConversation from "./SharedComponents/Conversation/GroupConversation";
import { IGroupConversation } from "@interfaces/conversationInterface";
import SecondaryHeader from "./SharedComponents/Header";
import Menu_Conversation from "./SharedComponents/MenuContext";

function Archive() {
  const conversations = useConversationStore((s) => s.conversations);
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );

  const isSelected = (conversationId: string) =>
    selectedConversation?.conversationId === conversationId;

  return (
    <div className="flex flex-col h-full">
      <SecondaryHeader title="Archived chats" mainTab="dashboard" />
      <Menu_Conversation />
      <div className="flex h-full w-full flex-col gap-2 overflow-y-scroll no-scrollbar">
        {conversations.map(
          (conversation) =>
            conversation.archived &&
            conversation.active && (
              <Conversation
                key={conversation.conversationId}
                conversation={conversation}
                isSelected={Boolean(() =>
                  isSelected(conversation.conversationId)
                )}
              />
            )
        )}
      </div>
    </div>
  );
}

export default Archive;
