"use client";
import { memo, useEffect } from "react";

import useMessageHistory from "@hooks/useMessageHistory";
import useUnreadMessages from "@hooks/useUnreadMessages";
import { useMessageStore } from "store/messageStore";
import { useConversationStore } from "../../../store/conversationStore";
import "./swiper.css";
import useReadReceiptHandler from "./useReadReceiptHandler";
import { useAiChat } from "context/AiChatProvider";
import { ChatBox } from "./ChatBox";

function AiChatArea() {
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const { messages,status } = useAiChat();
  const { messageHistory, fetchOlderMessages, hasNextPage, isLoading } = useMessageHistory();
  const unreadMessages = useUnreadMessages();
  const setReplyRequest = useMessageStore((s) => s.setReplyRequest);

  useEffect(() => setReplyRequest(null), [selectedConversation]);

  useReadReceiptHandler();

  function fetchFromMessageHistory() {
    if (hasNextPage) fetchOlderMessages();
  }

  return (
    <ChatBox
      messages={messages}
      messageHistory={messageHistory}
      unreadMessages={unreadMessages}
      isLoading={isLoading}
      virtualizerId={selectedConversation?.id!}
      onScrolledToTop={fetchFromMessageHistory}
      mode={status === 'streaming' ? 'streaming' : 'static'}
    />
  );
}

export default memo(AiChatArea);
