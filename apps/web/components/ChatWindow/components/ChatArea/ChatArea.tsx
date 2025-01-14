"use client";
import useSocket from "../../../../context/SocketProvider";
import {
  Fragment,
  MouseEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useMessagesByConversation,
  useMessageStore,
} from "../../../../store/messageStore";
import useAuth from "../../../../hooks/useAuth";
import { IMessageReadReceipt } from "../../../../enums/enums";
import { useStore } from "../../../../store/global";
import Chat, { IChat } from "./Chat";
import { VListHandle, Virtualizer } from "virtua";
import { motion } from "framer-motion";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./swiper.css";
import { useConversationStore } from "../../../../store/conversationStore";
import {
  IMessage,
  IReadReceiptUpdatesCollection,
  IUpdates,
  IUpdatesCollection,
} from "../../../../interfaces/messageInterface";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { downloadFromUrl } from "@lib/utils";
import Menu from "../../../ui/Menu";
import { useMenu } from "store/menu";
import useSelectedConversation from "@hooks/useSelectedConversation";

function ChatArea() {
  const { user } = useAuth();
  const selectedConversation = useSelectedConversation()

  const { messageHistory, messages, unreadMessages } =
    useMessagesByConversation();
  const getUnreadMessages = useMessageStore((s) => s.getUnreadMessages);
  const clearUnreadMessages = useMessageStore((s) => s.clearUnreadMessages);
  const getMessages = useMessageStore((s) => s.getUserMessages);
  const setReplyRequest = useMessageStore((s) => s.setReplyRequest);
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const replyMessageId = useStore((s) => s.replyMessageId);
  const setMenu = useMenu((s) => s.setMenu);

  const [newMessageBadge, setNewMessageBadge] = useState(0);

  const listRef = useRef<VListHandle>(null);
  const lastReadMsgIndex = useRef(0);
  const isFocused = useRef(true);
  const initialValue = useRef(0);
  const isScrolledToBottom = useRef(true);
  const haveNewMessages = useRef(!!unreadMessages.length);
  const lastMessageReference = useRef<IMessage | null>(null);
  const pointerEvent = useRef<NodeJS.Timeout | null>();
  const replyRef = useRef<string | null>(null);

  const conversationId = selectedConversation?.id;
  const canSelect = !!selectedChats.length;

  useEffect(() => {
    if (!conversationId) return;

    const _unreadMessages = getUnreadMessages(conversationId);
    const messages = getMessages(conversationId) || [];
    const _messageHistory =
      useMessageStore.getState().messageHistory.get(conversationId) || [];

    const totalMessages = _messageHistory.length + messages.length;

    if (!!_unreadMessages.length) {
      isScrolledToBottom.current = false;
      haveNewMessages.current = true;
    }

    lastReadMsgIndex.current = messages.length - _unreadMessages.length;

    const scrollToIndex = totalMessages - _unreadMessages.length;

    queueMicrotask(() =>
      listRef.current?.scrollToIndex(scrollToIndex, { align: "center" })
    );

    initialValue.current = messages.length;

    return () => {
      clearUnreadMessages(conversationId);
      isScrolledToBottom.current = true;
      haveNewMessages.current = false;
      initialValue.current = 0;
      isFocused.current = true;
      setReplyRequest(null);
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
        let update:IReadReceiptUpdatesCollection = {
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
    if (!isFocused.current)
      setNewMessageBadge(unreadMessages.length - initialValue.current);
    if (!unreadMessages.length) {
      initialValue.current = 0;
      haveNewMessages.current = false;
    }
  }, [unreadMessages]);

  useEffect(() => {
    const recentMessage = messages.at(-1) || null;

    const self =
      recentMessage?.from === user?.id &&
      recentMessage?.id !== lastMessageReference.current?.id;

    let index = messages.length + messageHistory.length;

    if (!haveNewMessages.current)
      lastReadMsgIndex.current = messages.length - 1;

    if (
      isScrolledToBottom.current ||
      (self && recentMessage?.from !== "system")
    )
      listRef.current?.scrollToIndex(index);

    lastMessageReference.current = recentMessage;
    return () => {
      haveNewMessages.current = false;
    };
  }, [messageHistory, messages, user]);

  //////////////////// handle scroll
  const handleScroll = (offset: number) => {
    const list = listRef.current;
    if (!list) return;
    const scrollOffset = list.viewportSize! + offset;
    const itemOffset = list.getItemOffset(
      messageHistory.length + lastReadMsgIndex.current
    )!;
    const lastItemOffset = list.getItemOffset(
      messageHistory.length + messages.length
    );
    if (scrollOffset === lastItemOffset) isScrolledToBottom.current = true;
    else isScrolledToBottom.current = false;
    if (scrollOffset > itemOffset) {
      setNewMessageBadge(0);
      initialValue.current = unreadMessages.length;
      isFocused.current = true;
    } else {
      isFocused.current = false;
    }
  };

  const handleSelectingChats = (chat: IMessage, index: number) => {
    if (pointerEvent.current) clearTimeout(pointerEvent.current);
    pointerEvent.current = setTimeout(() => {
      if (!canSelect) {
        selectChat(chat, index);
        pointerEvent.current = null;
      }
    }, 500);
  };

  function cancelSelectingChat(chat: IMessage, index: number) {
    if (pointerEvent.current) {
      clearTimeout(pointerEvent.current);
      canSelect && selectChat(chat, index);
    }
  }

  function selectChat(chat: IMessage, index: number) {
    setSelectedChats(chat);
  }

  function handleOpen(chat: IMessage, e: MouseEvent<HTMLDivElement>) {
    setMenu({ data: chat, reference: e.currentTarget, id: "chatarea" });
  }

  function handleOffsetToReply(messageId: string) {
    replyRef.current = messageId;

    let index = messages.findIndex((m) => m.id === messageId);
    if (index === -1)
      index = messageHistory.findIndex((m) => m.id === messageId);
    else index = index + messageHistory.length;

    listRef.current?.scrollToIndex(index);
    highlightReply();
  }

  const handleReplyingChat = (chat: IMessage) => {
    const setReplyRequest = useMessageStore.getState().setReplyRequest;

    const req = {
      messageId: chat.id,
      userId: chat.from!,
      message: chat.message,
      attachment: chat.attachment!,
    };

    setReplyRequest(req);
  };

  function highlightReply() {
    if (!replyRef.current) return;
    const elm = document.querySelector<HTMLElement>(
      `[data-id="${replyRef.current}"]`
    );
    if (!elm) return;
    elm.classList.remove("focus");
    elm.offsetWidth;
    elm.classList.add("focus");
    replyRef.current = null;
  }

  useEffect(() => {
    replyMessageId &&
      queueMicrotask(() => {
        handleOffsetToReply(replyMessageId);
      });
  }, [replyMessageId]);

  return (
    <div className="flex flex-1 basis-0 flex-col relative h-full overflow-y-auto no-scrollbar bg-gradient-to-t from-base-200 shadow-lg sm:rounded-2xl">
      <MenuContext />

      <span className="mt-auto"></span>

      <Virtualizer
        ref={listRef}
        onScroll={handleScroll}
        onScrollEnd={highlightReply}
      >
        {messageHistory.map((chat, index) => {
          if (!chat) return <></>;

          const self = user?.id === chat.from;
          const isStarred =
            selectedConversation?.starred?.some((c) => c.id === chat.id) ||
            false;
          const nextMsgIsFromDifferentUser =
            index === messageHistory.length - 1
              ? !messages.length
              : messageHistory[index + 1]?.from !== chat.from;
          const isGroupConversation = selectedConversation?.host === "group";

          return (
            <div
              data-id={chat.id}
              key={chat.id}
              onTouchStart={() => handleSelectingChats(chat, index)}
              onTouchEnd={(e) => {
                e.preventDefault();
                cancelSelectingChat(chat, index);
              }}
              onClick={() => canSelect && selectChat(chat, index)}
            >
              <Chat
                self={self}
                chat={chat}
                reply={chat.reply}
                canSelect={!!canSelect}
                displayAvatar={!self}
                hideAvatar={!nextMsgIsFromDifferentUser}
                displayUsername={!self && isGroupConversation}
                isStarred={isStarred}
                isSelected={selectedChats.includes(chat)}
                onReply={handleReplyingChat}
                onClickReply={handleOffsetToReply}
                menuButton={<MenuButton chat={chat} onClick={handleOpen} />}
              />
            </div>
          );
        })}

        {!!messages.length &&
          messages.map((chat, index) => {
            if (!chat) return <></>;

            const self = user?.id === chat.from;
            const isStarred =
              selectedConversation?.starred?.some((c) => c.id === chat.id) ||
              false;
            const nextMsgIsFromDifferentUser =
              index === messageHistory.length - 1
                ? !messages.length
                : messageHistory[index + 1]?.from !== chat.from;
            const isGroupConversation = selectedConversation?.host === "group";

            return (
              <Fragment key={chat.id}>
                {haveNewMessages.current &&
                  index === lastReadMsgIndex.current && (
                    <div className="flex justify-center">
                      <div
                        className={`w-full relative py-3 text-sm my-2 bg-primary flex justify-center items-center  `}
                      >
                        {unreadMessages.length} New messages
                      </div>
                    </div>
                  )}

                {chat.from === "system" ? (
                  <div className="flex justify-center px-4 my-2 pointer-events-none">
                    <label
                      className="py-1 px-2 w-max text-xs bg-base-300 rounded-2xl  text-center"
                      htmlFor=""
                    >
                      {chat.message}
                    </label>
                  </div>
                ) : (
                  <div
                    data-id={chat.id}
                    key={chat.id}
                    onTouchStart={() => handleSelectingChats(chat, index)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      cancelSelectingChat(chat, index);
                    }}
                    onClick={() => canSelect && selectChat(chat, index)}
                  >
                    <Chat
                      self={self}
                      chat={chat}
                      reply={chat.reply}
                      canSelect={!!canSelect}
                      displayAvatar={nextMsgIsFromDifferentUser}
                      displayUsername={!self && isGroupConversation}
                      isStarred={isStarred}
                      isSelected={selectedChats.includes(chat)}
                      onReply={handleReplyingChat}
                      onClickReply={handleOffsetToReply}
                      menuButton={
                        <MenuButton chat={chat} onClick={handleOpen} />
                      }
                    />
                  </div>
                )}
              </Fragment>
            );
          })}
      </Virtualizer>

      <UnreadMessageBadge count={newMessageBadge} />
    </div>
  );
}

function MenuButton({
  chat,
  onClick,
}: {
  chat: IMessage;
  onClick: (chat: IMessage, e: MouseEvent<HTMLDivElement>) => void;
}) {
  function handleClick(e: MouseEvent<HTMLDivElement>) {
    onClick(chat, e);
  }

  return (
    <div
      className="group-hover:opacity-100 opacity-0 btn btn-circle btn-ghost btn-xs"
      onClick={handleClick}
    >
      <EllipsisVerticalIcon className="size-5" />
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
  const {
    sendRequestToUnRegisterStarredMessage,
    sendRequestToRegisterStarredMessage,
  } = useSocket();
  const users = useStore((s) => s.users);
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const setModal = useStore((s) => s.setModal);

  function handleDeletingChat(chat: IMessage) {
    setModal({ activeModal: "deleteMessageModal", state: [chat], open: true });
  }

  const handleForward = useCallback(
    (chat: IMessage) => {
      setModal({
        activeModal: "forwardMessageModal",
        state: [chat],
        open: true,
      });
    },
    [users, users]
  );

  const handleMarkAsStarred = useCallback(
    (chat: IMessage) => {
      useConversationStore
        .getState()
        .addToStarred(selectedConversation?.id!, [chat]);
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
      useConversationStore
        .getState()
        .removeFromStarred(selectedConversation?.id!, chat.id);
      sendRequestToUnRegisterStarredMessage({
        conversationId: selectedConversation?.id!,
        messageId: chat.id,
        host: selectedConversation?.host!,
      });
    },
    [selectedConversation]
  );

  return (
    <Menu<IMessage> id="chatarea">
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
              <Menu.Item onClick={() => downloadFromUrl(chat.attachment?.url!)}>
                Download
              </Menu.Item>
            )}
            <Menu.Item onClick={() => handleForward(chat)}>Forward</Menu.Item>
            <Menu.Item
              onClick={() =>
                starred ? handleRemoveStarred(chat) : handleMarkAsStarred(chat)
              }
            >
              {starred ? "Unstar" : "Star"}
            </Menu.Item>
            <Menu.Item onClick={() => handleDeletingChat(chat)}>
              Delete
            </Menu.Item>
          </>
        );
      }}
    </Menu>
  );
}

export default memo(ChatArea);
