import UserConversation from "../components/UserConversation";
import React from "react";
import { useConversationStore } from "store/conversationStore";
import GroupConversation from "../components/GroupConversation";
import { IGroupConversation } from "@interfaces/conversationInterface";
import SecondaryHeader from "../components/Header";
import Menu_Conversation from "../components/MenuContext";

function Archive() {
  const conversations = useConversationStore((s) => s.conversations);
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );

  return (
    <div className="flex flex-col h-full">
      <SecondaryHeader title="Archived chats" mainTab="dashboard" />
      <Menu_Conversation />
      <div className="flex h-full w-full flex-col gap-2 overflow-y-scroll no-scrollbar">
        {conversations.map(
          (conversation) =>
            conversation.archived &&
            conversation.active &&
            (conversation.host === "user" ? (
              <UserConversation
                key={conversation.conversationId}
                conversation={conversation}
                isSelected={
                  selectedConversation?.conversationId ===
                  conversation.conversationId
                }
              />
            ) : (
              <GroupConversation
                key={conversation.conversationId}
                conversation={conversation as IGroupConversation}
                isSelectedGroup={
                  selectedConversation?.conversationId ===
                  conversation.conversationId
                }
              />
            ))
        )}
      </div>
    </div>
  );
}

export default Archive;
