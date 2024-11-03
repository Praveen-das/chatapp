import Conversation from "../Components/Conversation";
import useAuth from "@hooks/useAuth";
import React from "react";
import { useConversationStore } from "store/conversationStore";
import GroupConversation from "../Components/GroupConversation";
import { IGroupConversation } from "@interfaces/conversationInterface";

function Archive() {
  const { user } = useAuth();
  const conversations = useConversationStore((s) => s.conversations);
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-y-scroll no-scrollbar">
      {conversations.map(
        (conversation) =>
          conversation.isArchived &&
          !conversation.deletedUsers?.includes(user?.id!) &&
          (conversation.host === "user" ? (
            <Conversation
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversation?.id === conversation.id}
            />
          ) : (
            <GroupConversation
              key={conversation.id}
              conversation={conversation as IGroupConversation}
              isSelectedGroup={selectedConversation?.id === conversation.id}
            />
          ))
      )}
    </div>
  );
}

export default Archive;
