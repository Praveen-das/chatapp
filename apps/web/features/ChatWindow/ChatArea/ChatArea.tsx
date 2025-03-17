"use client";
import useSocket from "../../../context/SocketProvider";
import { Fragment, memo, useCallback, useEffect, useRef, useState } from "react";
import useAuth from "../../../hooks/useAuth";
import { IMessageReadReceipt } from "../../../enums/enums";
import { useStore } from "../../../store/global";
import Chat from "./Chat/Chat";
import { VListHandle, Virtualizer } from "virtua";
import { motion } from "framer-motion";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./swiper.css";
import { useConversationStore } from "../../../store/conversationStore";
import { IMessage, IReadReceiptUpdatesCollection, IUpdates } from "../../../interfaces/messageInterface";
import { downloadFromUrl } from "@lib/utils";
import Menu from "../../ui/Menu";
import useMessageHistory from "@hooks/useMessageHistory";
import SystemMessage from "./Chat/Message/SystemMessage";
import useMessages from "@hooks/useMessages";
import useUnreadMessages from "@hooks/useUnreadMessages";
import { useMessageStore } from "store/messageStore";
import { useMenu } from "store/menu";

function ChatArea() {
  const { user } = useAuth();
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const messages = useMessages();
  const { messageHistory, fetchOlderMessages, hasNextPage, isLoading } = useMessageHistory();
  const unreadMessages = useUnreadMessages();

  const getUnreadMessages = useMessageStore((s) => s.getUnreadMessages);
  const clearUnreadMessages = useMessageStore((s) => s.clearUnreadMessages);
  const getMessages = useMessageStore((s) => s.getUserMessages);
  const setReplyRequest = useMessageStore((s) => s.setReplyRequest);
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);

  const [newMessageBadge, setNewMessageBadge] = useState(0);

  const [listRef, setListRef] = useState<VListHandle | null>(null);
  const lastReadMsgIndex = useRef(0);
  const isFocused = useRef(true);
  const initialValue = useRef(0);
  const isScrolledToBottom = useRef(true);
  const haveNewMessages = useRef(!!unreadMessages.length);
  const lastMessageReference = useRef<IMessage | null>(null);
  const pointerEvent = useRef<NodeJS.Timeout | null>();
  const isStartElm = useRef(false);
  const canShift = useRef(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const conversationId = selectedConversation?.id;
  const canSelect = !!selectedChats.length;

  useEffect(() => {
    if (!conversationId) return;

    const _unreadMessages = getUnreadMessages(conversationId);
    const messages = getMessages(conversationId) || [];
    const _messageHistory = useMessageStore.getState().messageHistory.get(conversationId) || [];

    const totalMessages = _messageHistory.length + messages.length;

    if (!!_unreadMessages.length) {
      isScrolledToBottom.current = false;
      haveNewMessages.current = true;
    }

    lastReadMsgIndex.current = messages.length - _unreadMessages.length;

    const scrollToIndex = totalMessages - _unreadMessages.length;

    listRef?.scrollToIndex(scrollToIndex, { align: "center" });

    initialValue.current = messages.length;

    return () => {
      clearUnreadMessages(conversationId);
      isScrolledToBottom.current = true;
      haveNewMessages.current = false;
      initialValue.current = 0;
      isFocused.current = true;
      setReplyRequest(null);
      isStartElm.current = false;
      // socket.selectedConversation = null
    };
  }, [selectedConversation, user]);

  //////////////////// send readreceiptChangeRequest
  useEffect(() => {
    if (!conversationId) return;

    const updates: IUpdates = new Map();
    const _unreadMessages = getUnreadMessages(conversationId);

    const status = IMessageReadReceipt.seen;

    for (let { id, from } of _unreadMessages || []) {
      const isReceiver = from !== user?.id;

      if (isReceiver) {
        let update: IReadReceiptUpdatesCollection = {
          id,
          readReceipt: [{ userId: user?.id!, status }],
        };

        let key = {
          conversationId: selectedConversation.conversationId,
          to: from!,
        };

        updates.upsert(key, update);
      }

      useSocket.getState().sendReadReceiptChangeRequest(updates);
    }
  }, [user, selectedConversation]);

  //////////////////// setNewMessageBadge
  useEffect(() => {
    if (!isFocused.current) {
      setNewMessageBadge(unreadMessages.length - initialValue.current);
    }
    if (!unreadMessages.length) {
      initialValue.current = 0;
      haveNewMessages.current = false;
    }
  }, [unreadMessages]);

  useEffect(() => {
    const recentMessage = messages.at(-1) || null;

    const self = recentMessage?.from === user?.id && recentMessage?.id !== lastMessageReference.current?.id;

    let index = messages.length + messageHistory.length;

    if (!haveNewMessages.current) lastReadMsgIndex.current = messages.length - 1;

    if (isScrolledToBottom.current || (self && recentMessage?.from !== "system")) listRef?.scrollToIndex(index);

    lastMessageReference.current = recentMessage;
  }, [messageHistory, messages, user]);

  useEffect(() => {
    const myCustomEvent = (event: any) => handleOffsetToReply(event.detail.id);
    document.addEventListener("myCustomEvent", myCustomEvent);
    return () => document.removeEventListener("myCustomEvent", myCustomEvent);
  }, [messages, messageHistory, listRef]);

  //////////////////// handle scroll
  const onScroll = useCallback(() => {
    if (!listRef) return;

    const THRESHOLD = 2;
    const startIndex = listRef.findStartIndex();
    const endIndex = listRef.findEndIndex();
    const lastItemIndex = messageHistory.length + messages.length - 1;
    const lastReadIndex = messageHistory.length + lastReadMsgIndex.current;

    if (startIndex <= THRESHOLD && !isStartElm.current && hasNextPage) {
      fetchOlderMessages();
      canShift.current = true;
      isStartElm.current = true;
    }

    if (startIndex > THRESHOLD) {
      isStartElm.current = false;
      canShift.current = false;
    }

    if (endIndex > lastReadIndex) {
      setNewMessageBadge(0);
      initialValue.current = unreadMessages.length;
      isFocused.current = true;
    } else {
      isFocused.current = false;
    }

    isScrolledToBottom.current = endIndex === lastItemIndex;
  }, [messageHistory, messages, unreadMessages, hasNextPage]);

  const handleSelectingChats = useCallback(
    (chat: IMessage) => {
      if (pointerEvent.current) clearTimeout(pointerEvent.current);
      pointerEvent.current = setTimeout(() => {
        if (!canSelect) {
          setSelectedChats(chat);
          pointerEvent.current = null;
        }
      }, 500);
    },
    [canSelect]
  );

  const cancelSelectingChat = useCallback(
    (chat: IMessage) => {
      if (pointerEvent.current) {
        clearTimeout(pointerEvent.current);
        canSelect && setSelectedChats(chat);
      }
    },
    [canSelect]
  );

  const handleOffsetToReply = useCallback(
    (messageId: string) => {
      if (!listRef) return;

      let index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) index = messageHistory.findIndex((m) => m.id === messageId);
      else index = index + messageHistory.length;

      listRef.scrollToIndex(index);

      if (timeout.current) clearTimeout(timeout.current);

      timeout.current = setTimeout(() => {
        const elm = document.querySelector<HTMLElement>(`[data-id="${messageId}"]`);
        if (!elm) return;

        elm.classList.remove("focus");
        void elm.offsetWidth;
        elm.classList.add("focus");
      }, 100);
    },
    [messages, messageHistory, listRef]
  );

  const renderChat = useCallback(
    (chat: IMessage, index: number, array: IMessage[]) => {
      if (!chat) return null;

      const self = user?.id === chat.from;
      const lastMsg = index === array.length - 1;
      const nextMsgIsFromSameUser = array[index - 1]?.from !== chat.from;
      const canDisplayAvatar = lastMsg ? false : nextMsgIsFromSameUser;
      const isGroupConversation = selectedConversation?.host === "group";
      const avatarVisibility = !self && isGroupConversation ? (canDisplayAvatar ? "visible" : "hidden") : "none";

      if (chat.from === "system") return <SystemMessage text={chat.message} />;

      return (
        <Fragment key={chat.id}>
          {haveNewMessages.current && index === lastReadMsgIndex.current && (
            <div className="flex justify-center">
              <div className="w-full relative py-3 text-sm my-2 bg-primary flex justify-center items-center">
                {unreadMessages.length} New messages
              </div>
            </div>
          )}
          <div
            data-id={chat.id}
            onTouchStart={() => handleSelectingChats(chat)}
            onTouchEnd={(e) => {
              e.preventDefault();
              cancelSelectingChat(chat);
            }}
            onClick={() => canSelect && setSelectedChats(chat)}
          >
            <Chat
              self={self}
              chat={chat}
              reply={chat.reply}
              canSelect={!!canSelect}
              avatarVisibility={avatarVisibility}
              displayUsername={isGroupConversation && !self}
              isSelected={selectedChats.includes(chat)}
            />
          </div>
        </Fragment>
      );
    },
    [user, messages, selectedConversation, selectedChats, canSelect]
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      <div className="flex-col relative flex flex-1 basis-0 h-full overflow-y-auto no-scrollbar bg-gradient-to-t from-base-200 shadow-lg sm:rounded-2xl">
        <MenuContext />
        <span className="mt-auto"/>
        {isLoading && (
          <div className="flex justify-center items-center text-sm text-primary">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        )}
        <Virtualizer ref={setListRef} onScroll={onScroll} shift={canShift.current}>
          {messageHistory?.map(renderChat)}
          {messages.map(renderChat)}
        </Virtualizer>
        <UnreadMessageBadge count={newMessageBadge} />
      </div>
    </div>
  );
}

function UnreadMessageBadge({ count }: { count: number }) {
  return (
    <motion.div
      className="flex justify-center items-center absolute bottom-4 right-4 w-7 h-7 rounded-full bg-primary text-xs"
      initial={{ scale: 0, translateY: 0 }}
      animate={{ scale: count > 0 ? 1 : 0 }}
    >
      {count}
    </motion.div>
  );
}

function MenuContext() {
  const { sendRequestToUnRegisterStarredMessage, sendRequestToRegisterStarredMessage } = useSocket();
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
      useConversationStore.getState().addToStarred(selectedConversation?.id!, [chat]);
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
      useConversationStore.getState().removeFromStarred(selectedConversation?.id!, chat.id);
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
