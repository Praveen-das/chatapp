import { useMemo } from "react";
import { useConversationStore } from "../store/conversationStore";
import { IConversation } from "@interfaces/conversationInterface";

const useSelectedConversation = <T extends IConversation>(conversationId: string): T | undefined => {
  const conversations = useConversationStore((s) => s.conversations);

  const conversation = useMemo(
    () => conversations.find((c): c is T => c.id === conversationId),
    [conversations, conversationId]
  );

  return conversation;
};

export default useSelectedConversation;
