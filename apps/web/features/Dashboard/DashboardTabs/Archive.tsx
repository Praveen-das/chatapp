import Conversation from "./SharedComponents/Conversation/Conversation";
import React from "react";
import { useConversationStore } from "store/conversationStore";
import GroupConversation from "./SharedComponents/Conversation/GroupConversation";
import { IGroupConversation } from "@repo/interfaces/conversationInterface";
import SecondaryHeader from "./SharedComponents/Header";
import Menu_Conversation from "./SharedComponents/MenuContext";
import { AnimatePresence } from "framer-motion";
import MotionWrapper from "./SharedComponents/Conversation/MotionWrapper";

function Archive() {
  const conversations = useConversationStore((s) => s.conversations);
  const selectedConversation = useConversationStore((s) => s.selectedConversation);

  return (
    <div className="flex flex-col h-full">
      <SecondaryHeader title="Archived chats" mainTab="dashboard" />
      <Menu_Conversation />
      <div className="flex h-full w-full flex-col gap-6 overflow-y-scroll no-scrollbar">
        <AnimatePresence initial={false} mode="popLayout">
          {conversations.map((conversation) => {
            let isSelected = conversation.id === selectedConversation?.id
            return (
              conversation.archived &&
              conversation.active && (
                <MotionWrapper key={conversation.id}>
                  <Conversation
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={isSelected}
                  />
                </MotionWrapper>
              )
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Archive;
