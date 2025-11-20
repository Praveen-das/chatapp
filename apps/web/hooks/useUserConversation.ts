import { IUserConversation } from "@interfaces/conversationInterface";
import { getMemberById } from "@lib/conversation";
import React from "react";
import { useConversationStore } from "store/conversationStore";

function useUserConversation(userId: string) {
  return useConversationStore(
    (s) => s.conversations.find((c) => c.host === "user" && getMemberById(c, userId)) as IUserConversation
  );
}

export default useUserConversation;
