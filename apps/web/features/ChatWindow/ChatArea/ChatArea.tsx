"use client";
import { memo, useEffect } from "react";

import useMessageHistory from "@hooks/useMessageHistory";
import useMessages from "@hooks/useMessages";
import useUnreadMessages from "@hooks/useUnreadMessages";
import { useMessageStore } from "store/messageStore";
import { useConversationStore } from "../../../store/conversationStore";
import "./swiper.css";
import useReadReceiptHandler from "./useReadReceiptHandler";
import { ChatBox } from "./ChatBox";

function ChatArea() {
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const messages = useMessages();
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
    />
  );
}

export default memo(ChatArea);
