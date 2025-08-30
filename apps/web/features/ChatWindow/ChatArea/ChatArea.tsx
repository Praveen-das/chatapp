"use client";
import { motion } from "framer-motion";
import { Key, memo, useCallback, useEffect, useRef, useState } from "react";
import { VListHandle, Virtualizer } from "virtua";
import useSocket from "../../../context/SocketProvider";
import { useStore } from "../../../store/global";

import useMessageHistory from "@hooks/useMessageHistory";
import useMessages from "@hooks/useMessages";
import useUnreadMessages from "@hooks/useUnreadMessages";
import { downloadFromUrl } from "@lib/utils";
import { useMessageStore } from "store/messageStore";
import { IMessage } from "../../../interfaces/messageInterface";
import { useConversationStore } from "../../../store/conversationStore";
import Menu from "../../ui/Menu";
import "./swiper.css";
import { useChats } from "./useChats";
import useReadReceiptHandler from "./useReadReceiptHandler";
import useScrollForNewMessages from "./useScrollForNewMessages";
import useScrollHandler from "./useScrollHandler";
import useScrollToReply from "./useScrollToReply";

function ChatArea() {
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const messages = useMessages();
  const { messageHistory, fetchOlderMessages, hasNextPage, isLoading } = useMessageHistory();
  const unreadMessages = useUnreadMessages();
  const clearUnreadMessages = useMessageStore((s) => s.clearUnreadMessages);
  const setReplyRequest = useMessageStore((s) => s.setReplyRequest);

  useEffect(
    () => () => {
      setReplyRequest(null);
      clearUnreadMessages(selectedConversation?.id);
    },
    [selectedConversation]
  );

  // handles sending last seen change request
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

type ChatBox = {
  messages: IMessage[];
  messageHistory: IMessage[];
  unreadMessages: IMessage[];
  isLoading?: boolean;
  virtualizerId: Key;
  onScrolledToTop: () => void;
};

function ChatBox({ messages, messageHistory, unreadMessages, isLoading, virtualizerId, onScrolledToTop }: ChatBox) {
  const [listRef, setListRef] = useState<VListHandle | null>(null);
  const [newMessageBadge, setNewMessageBadge] = useState(0);
  const [canShowUnreadNotificationBar, setShowUnreadNotificationBar] = useState(false);

  const isFocused = useRef(true);
  const initialValue = useRef(0);
  const isScrolledToBottom = useRef(true);

  const previousMessages = useChats(messageHistory, {
    enable: !messages.length && canShowUnreadNotificationBar,
    position: messageHistory.length - unreadMessages.length,
    value: unreadMessages.length,
  });

  const newMessages = useChats(messages, {
    enable: !!messages.length && canShowUnreadNotificationBar,
    position: messages.length - unreadMessages.length,
    value: unreadMessages.length,
  });

  const { canShift, onScroll } = useScrollHandler({
    id: virtualizerId,
    messages,
    messageHistory,
    unreadMessages,
    listRef,
    initialValue,
    isScrolledToBottom,
    isFocused,
    setNewMessageBadge,
    onScrolledToTop,
  });

  // Custom hook to handle setting scrollbar for new messages and setting initial scrollbar position and messages flag
  useScrollForNewMessages({
    listRef,
    messages,
    messageHistory,
    unreadMessages,
    initialValue,
    isScrolledToBottom: isScrolledToBottom.current,
    isFocused: isFocused.current,
    setNewMessageBadge,
    setShowUnreadNotificationBar,
  });

  // handles reply messages click event
  useScrollToReply({
    messages,
    messageHistory,
    listRef,
  });

  useEffect(
    () => () => {
      setShowUnreadNotificationBar(false);
      initialValue.current = 0;
      isScrolledToBottom.current = true;
      isFocused.current = true;
    },
    [virtualizerId]
  );

  return (
    <div className="flex flex-col flex-1 relative">
      {isLoading && (
        <div className="absolute top-0 w-full flex justify-center items-center text-sm text-primary">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      )}
      <div className="flex-col flex flex-1 basis-0 h-full overflow-y-auto">
        <MenuContext />
        <span className="mt-auto" />
        <Virtualizer key={virtualizerId} ref={setListRef} onScroll={onScroll} shift={canShift.current}>
          {previousMessages}
          {newMessages}
        </Virtualizer>
        <UnreadMessageBadge count={newMessageBadge} />
      </div>
    </div>
  );
}

function UnreadMessageBadge({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      className="flex justify-center items-center absolute bottom-4 right-4 w-7 h-7 rounded-full bg-primary text-xs cursor-pointer"
      initial={{ scale: 0, translateY: 0 }}
      animate={{ scale: count > 0 ? 1 : 0 }}
    >
      {count}
    </motion.div>
  );
}

function MenuContext() {
  const { sendRequestToUnRegisterStarredMessage, sendRequestToRegisterStarredMessage } = useSocket();
  const { addToStarred, removeFromStarred } = useConversationStore((s) => s.conversationActions);
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const setModal = useStore((s) => s.setModal);

  function handleDeletingChat(chat: IMessage) {
    setModal({ activeModal: "deleteMessageModal", state: [chat], open: true });
  }

  const handleForward = useCallback((chat: IMessage) => {
    setModal({
      activeModal: "forwardMessageModal",
      state: [chat],
      open: true,
    });
  }, []);

  const handleMarkAsStarred = useCallback(
    (chat: IMessage) => {
      addToStarred(selectedConversation?.id!, [chat]);
      selectedConversation?.host !== "system" &&
        sendRequestToRegisterStarredMessage({
          conversationId: selectedConversation?.id!,
          messageIds: [chat.id],
          host: selectedConversation?.host!,
        });
    },
    [selectedConversation]
  );

  const handleRemoveStarred = useCallback(
    (chat: IMessage) => {
      removeFromStarred(selectedConversation?.id!, chat.id);
      selectedConversation?.host !== "system" &&
        sendRequestToUnRegisterStarredMessage({
          conversationId: selectedConversation?.id!,
          messageId: chat.id,
          host: selectedConversation?.host!,
        });
    },
    [selectedConversation]
  );

  return (
    <Menu<IMessage> id="chatarea" stopScroll>
      {(chat) => {
        const conversation = useConversationStore
          .getState()
          .conversations.find((c) => c.id === selectedConversation?.id)!;
        let starred = conversation.starred?.find((m) => m.id === chat.id);

        return chat.deleted ? (
          <Menu.Item onClick={() => handleDeletingChat(chat)}>Delete</Menu.Item>
        ) : (
          <>
            <Menu.Item onClick={() => setSelectedChats(chat)}>Select</Menu.Item>
            {chat.attachment?.type == "images" && (
              <Menu.Item onClick={() => downloadFromUrl(chat.attachment?.url!)}>Download</Menu.Item>
            )}
            <Menu.Item onClick={() => handleForward(chat)}>Forward</Menu.Item>
            <Menu.Item onClick={() => (starred ? handleRemoveStarred(chat) : handleMarkAsStarred(chat))}>
              {starred ? "Unstar" : "Star"}
            </Menu.Item>
            <Menu.Item onClick={() => handleDeletingChat(chat)}>Delete</Menu.Item>
          </>
        );
      }}
    </Menu>
  );
}

export default memo(ChatArea);
