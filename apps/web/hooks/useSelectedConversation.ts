import { useEffect, useMemo } from "react";
import { useConversationStore } from "../store/conversationStore";
import { useStore } from "store/global";

const useSelectedConversation = () => {
  const conversations = useConversationStore((s) => s.conversations);
  const sc = useConversationStore((s) => s.selectedConversation);
  const su = useStore((s) => s.selectedUser);
  const conversation = useMemo(
    () =>
      conversations.find((c) => c.conversationId === sc?.conversationId || c.host === 'user' && c.members.some(m=>m.id === su?.id)) ||
      null,
    [conversations, sc, su]
  );

  return conversation;
};

export default useSelectedConversation;
