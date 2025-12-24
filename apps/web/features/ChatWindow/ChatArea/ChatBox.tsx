"use client";
import { motion } from "framer-motion";
import { Key, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VListHandle, Virtualizer } from "virtua";
import useSocket from "../../../context/SocketProvider";
import { useStore } from "../../../store/global";

import { downloadFromUrl } from "@lib/utils";
import { useMessageStore } from "store/messageStore";
import { IMessage } from "../../../interfaces/messageInterface";
import { useConversationStore } from "../../../store/conversationStore";
import Menu from "../../ui/Menu";
import "./swiper.css";
import { useChats } from "./useChats";
import useScrollForNewMessages from "./useScrollForNewMessages";
import useScrollHandler from "./useScrollHandler";
import useScrollToReply from "./useScrollToReply";
import useAuth from "@hooks/useAuth";
import Acknowledgment from "./Chat/ChatIndicators/Acknowledgment";
import { getUserReadReceiptState } from "@lib/conversation";
import moment from "moment";
import useSelectedConversation from "@hooks/useSelectedConversation";

type ChatBox = {
  messages: IMessage[];
  messageHistory: IMessage[];
  unreadMessages: IMessage[];
  isLoading?: boolean;
  virtualizerId: Key;
  mode?: "static" | "streaming";
  onScrolledToTop: () => void;
};

export function ChatBox({
  messages,
  messageHistory,
  unreadMessages,
  isLoading,
  mode,
  virtualizerId,
  onScrolledToTop,
}: ChatBox) {
  const [listRef, setListRef] = useState<VListHandle | null>(null);
  const [newMessageBadge, setNewMessageBadge] = useState(0);
  const [canShowUnreadNotificationBar, setShowUnreadNotificationBar] = useState(false);

  const isFocused = useRef(true);
  const initialValue = useRef(0);
  const isScrolledToBottom = useRef(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const canShift = useRef(false);
  const prevHistoryLength = useRef(0);
  const prevMessagesLength = useRef(0);

  const setScrollPosition = useConversationStore((s) => s.conversationActions.setScrollPosition);
  const scrollPositionRef = useRef(0);

  useMemo(() => {
    // shift should be true strictly when history grows (prepending) and it's not the initial load
    // We also ensure new messages aren't interfering
    if (
      messageHistory.length > prevHistoryLength.current &&
      prevHistoryLength.current > 0 &&
      messages.length === prevMessagesLength.current
    ) {
      canShift.current = true;
    } else {
      canShift.current = false;
    }

    // Update refs for next render
    prevHistoryLength.current = messageHistory.length;
    prevMessagesLength.current = messages.length;
  }, [messageHistory.length, messages.length]);

  const previousMessages = useChats(messageHistory, {
    enable: !messages.length && canShowUnreadNotificationBar,
    position: messageHistory.length - unreadMessages.length,
    value: unreadMessages.length,
  });

  const newMessages = useChats(
    messages,
    {
      enable: !!messages.length && canShowUnreadNotificationBar,
      position: messages.length - unreadMessages.length,
      value: unreadMessages.length,
    },
    mode
  );

  const onScroll = useScrollHandler({
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
    container: scrollContainerRef,
    scrollPositionRef,
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
      setScrollPosition(virtualizerId as string, scrollPositionRef.current);

      // Reset length refs on conversation change
      prevHistoryLength.current = 0;
      prevMessagesLength.current = 0;
      setShowUnreadNotificationBar(false);
      initialValue.current = 0;
      isScrolledToBottom.current = true;
      isFocused.current = true;
    },
    [virtualizerId]
  );

  return (
    <div className="flex flex-col flex-1 relative ">
      {isLoading && (
        <div className="absolute top-0 w-full flex justify-center items-center text-sm text-primary">
          <span className="loading loading-spinner loading-sm"></span>
        </div>
      )}
      <div ref={scrollContainerRef} className="flex-col flex flex-1 basis-0 h-full overflow-y-auto">
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
  const { user } = useAuth();
  const { sendRequestToUnRegisterStarredMessage, sendRequestToRegisterStarredMessage } = useSocket();
  const selectedConversation = useSelectedConversation();
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const setModal = useStore((s) => s.setModal);
  const [selectedChatReadReceipt, setSelectedChatReadReceipt] = useState<Record<string, number> | null>(null);

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
      selectedConversation?.host !== "system" &&
        sendRequestToRegisterStarredMessage({
          conversationId: selectedConversation?.id!,
          message: chat,
          host: selectedConversation?.host!,
        });
    },
    [selectedConversation]
  );

  const handleRemoveStarred = useCallback(
    (chat: IMessage) => {
      selectedConversation?.host !== "system" &&
        sendRequestToUnRegisterStarredMessage({
          conversationId: selectedConversation?.id!,
          message: chat,
          host: selectedConversation?.host!,
        });
    },
    [selectedConversation]
  );

  const handleOpenInfo = useCallback((readReceipt: Record<string, number> | null) => {
    setSelectedChatReadReceipt(readReceipt);
  }, []);

  const handleCloseInfo = useCallback(() => {
    setSelectedChatReadReceipt(null);
  }, []);

  return (
    <Menu<IMessage> id="chatarea" onClose={handleCloseInfo} stopScroll>
      {selectedChatReadReceipt ? (
        <Menu.Item
          className="pointer-events-none !p-2 !rounded-none"
          canClose={false}
          canSelect={false}
          onClick={handleCloseInfo}
        >
          <div className="grid grid-cols-2 gap-2">
            {selectedChatReadReceipt.lastReadMessageTimestamp && (
              <>
                <span className="flex items-center gap-2">
                  Read
                  <Acknowledgment readReceipt="seen" />
                </span>
                <span className="justify-self-end">
                  {moment(selectedChatReadReceipt.lastReadMessageTimestamp).format("h:mm A")}
                </span>
              </>
            )}
            {selectedChatReadReceipt.lastDeliveredMessageTimestamp && (
              <>
                <span className="flex items-center gap-2">
                  Delivered
                  <Acknowledgment readReceipt="received" />
                </span>
                <span className="justify-self-end">
                  {moment(selectedChatReadReceipt.lastDeliveredMessageTimestamp).format("h:mm A")}
                </span>
              </>
            )}
          </div>
        </Menu.Item>
      ) : (
        (chat) => {
          const conversation = useConversationStore
            .getState()
            .conversations.find((c) => c.id === selectedConversation?.id)!;
          let starred = conversation.starred?.find((m) => m.id === chat.id);
          const readReceipt = getUserReadReceiptState(selectedConversation!, chat);

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
              {/* {chat.from === user?.id && readReceipt && (
                <Menu.Item canClose={false} onClick={() => handleOpenInfo(readReceipt)}>
                  Info
                </Menu.Item>
              )} */}
            </>
          );
        }
      )}
    </Menu>
  );
}
