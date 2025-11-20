import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";
import { IConversation } from "@interfaces/conversationInterface";

const useSelectedConversation = <T extends IConversation>(): T | undefined => {
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const conversation = useConversationStore(
    useShallow((s) => s.conversations.find((c): c is T => c.id === selectedConversation?.id))
  );

  return conversation;
};

export default useSelectedConversation;
