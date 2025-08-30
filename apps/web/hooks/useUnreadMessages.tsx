import { IMessage } from "@repo/interfaces/messageInterface";
import React, { useEffect, useRef, useState } from "react";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";
import { shallow } from "zustand/shallow";

function useUnreadMessages() {
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );
  const conversationId = selectedConversation?.id!;

  const [unreadMessages, setUnreadMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    const unsubscribe = useMessageStore.subscribe(
      (state) => state.unreadMessages.get(conversationId)?.slice() || [],
      (newValue) => setUnreadMessages(newValue),
      { equalityFn: shallow, fireImmediately: true }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  return unreadMessages;
}

export default useUnreadMessages;
