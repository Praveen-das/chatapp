import { useConversationStore } from "../store/conversationStore";
import { useShallow } from "zustand/react/shallow";
import { IConversation } from "@interfaces/conversationInterface";
import { IGroupConversation } from "@repo/interfaces/conversationInterface";

const useGroupConversation = (id: string) => {
  const conversation = useConversationStore(
    useShallow((s) => s.conversations.find((c) => c.host === "group" && c.id === id))
  );

  return conversation as IGroupConversation;
};

export default useGroupConversation;
