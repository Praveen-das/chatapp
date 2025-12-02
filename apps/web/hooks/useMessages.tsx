import { IMessage } from "@repo/interfaces/messageInterface";
import React, { useEffect, useRef, useState } from "react";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { shallow } from "zustand/shallow";

function useMessages() {
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const conversationId = selectedConversation?.id!;

  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    const unsubscribe = useMessageStore.subscribe(
      (state) => state.messageStore.get(conversationId)?.slice() || [],
      (newValue) => setMessages(newValue),
      { equalityFn: shallow, fireImmediately: true }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  return messages;
}

export default useMessages;
