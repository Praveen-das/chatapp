"use client";
import { useSocket } from "../../../../context/SocketProvider";
import React, { Fragment, memo, useCallback, useEffect, useRef, useState } from "react";
import { useConversation, useMessages } from "../../../../store/messageStore";
import { useAuth } from "../../../../context/AuthContext";
import { IMessageReadReceipt } from "../../../../enums/enums";
import { useStore } from "../../../../store/global";
import Chat from "./Chat";
import { VList, VListHandle } from "virtua";
import { motion } from 'framer-motion'

function ChatArea() {
  const selectedConversation = useStore(s => s.selectedConversation);
  const conversationId = selectedConversation?.id || '';

  const { messages, unreadMessages } = useConversation()

  const clearUnreadMessages = useMessages(s => s.clearUnreadMessages);
  const getUnreadMessages = useMessages(s => s.getUnreadMessages);
  const getMessages = useMessages(s => s.getUserMessages);
  const { sendReadReceiptChangeRequest } = useSocket();
  const replyRequest = useMessages(s => s.replyRequest);
  const setReplyRequest = useMessages(s => s.setReplyRequest);
  const { user } = useAuth();

  const [newMessageBadge, setNewMessageBadge] = useState(0);

  const listRef = useRef<VListHandle>(null);
  const lastReadMsgIndex = useRef(messages.length)
  const isFocused = useRef(true)
  const initialValue = useRef(0)
  const isScrolledToBottom = useRef(true)
  const haveNewMessages = useRef(false)

  //////////////////// send readreceiptChangeRequest
  useEffect(() => {
    const _unreadMessages = getUnreadMessages(conversationId)
    const messages = getMessages(conversationId) || []

    if (!!_unreadMessages.length) {
      isScrolledToBottom.current = false
      haveNewMessages.current = true
    }

    const index = messages.length - (_unreadMessages.length || 1)

    lastReadMsgIndex.current = index

    const scrollToIndex = _unreadMessages.length > 3 ? index + 2 : index + 1

    queueMicrotask(() => listRef.current?.scrollToIndex(scrollToIndex, { align: 'end' }))

    initialValue.current = _unreadMessages.length

    const updates: IUpdates = new Map();

    for (let { id, from } of _unreadMessages || []) {

      const isReceiver = from !== user?.id

      if (isReceiver) {
        let update: IUpdatesCollection = {
          id,
          readReceipt: [
            {
              userId: user?.id!,
              status: IMessageReadReceipt.seen
            }
          ]
        }

        let key = { conversationId, to: from }
        updates.upsert(key, update);
      }

      sendReadReceiptChangeRequest(updates);
    }

    return () => {
      clearUnreadMessages(conversationId)
      isScrolledToBottom.current = true
      haveNewMessages.current = false
      initialValue.current = 0
      isFocused.current = true
    };
  }, [selectedConversation, user]);

  //////////////////// handle scroll
  const handleScroll = (offset: number) => {
    const list = listRef.current

    if (!list) return
    if (!lastReadMsgIndex.current) return

    const scrollOffset = list.viewportSize! + offset
    const itemOffset = list.getItemOffset(lastReadMsgIndex.current)!
    const lastItemOffset = list.getItemOffset(messages.length)

    if (scrollOffset === lastItemOffset)
      isScrolledToBottom.current = true
    else isScrolledToBottom.current = false

    if (scrollOffset > itemOffset) {
      setNewMessageBadge(0)
      initialValue.current = unreadMessages.length
      isFocused.current = true
    } else isFocused.current = false
  }

  /////////setNewMessageBadge
  useEffect(() => {
    if (!isFocused.current)
      setNewMessageBadge(unreadMessages.length - initialValue.current)
    if (!unreadMessages.length) {
      initialValue.current = 0
      haveNewMessages.current = false
    }
  }, [unreadMessages])

  const handleReply = useCallback((message: string, index: number) => {
    setReplyRequest({ message, offsetTop: listRef.current?.getItemOffset(index) || 0 })
  }, [])

  const handleClickOnReply = useCallback((index: number) => listRef.current?.scrollTo(index), [handleReply])

  useEffect(() => {
    const lastMsg = messages.at(-1)
    const self = lastMsg?.from === user?.id
    let index = messages.length
    if (!haveNewMessages.current) lastReadMsgIndex.current = index - 1
    if (isScrolledToBottom.current || self) listRef.current?.scrollToIndex(index, { align: 'end' });
  }, [messages, user])

  return (
    <>
      <div className='flex flex-col relative h-full overflow-hidden bg-gradient-to-t from-zinc-700 rounded-2xl'>
        <div className='flex flex-col w-full h-full overflow-y-scroll no-scrollbar'>
          <VList
            reverse
            ref={listRef}
            onScroll={handleScroll}
            style={{ height: '100%' }}
            count={messages.length}
            className="overflow-y-scroll no-scrollbar"
          >
            {(index) => {
              const chat = messages[index];

              if (!chat) return <></>

              const self = user?.id === chat.from;

              const isLastReadMessage = haveNewMessages.current ? index === lastReadMsgIndex.current : index === messages.length

              return (
                <Fragment key={chat.id}>
                  {
                    isLastReadMessage && haveNewMessages.current &&
                    <div className="flex justify-center">
                      <div className={`w-full py-3 text-sm my-2 bg-primary flex justify-center items-center text-white `}>
                        {unreadMessages.length} Unread messages
                      </div>
                    </div>
                  }
                  <Chat
                    index={index}
                    key={chat.id}
                    onReply={handleReply}
                    self={self}
                    chat={chat}
                    onClickReply={handleClickOnReply}
                  />
                </Fragment>)
            }}
          </VList>
        </div>
        {
          replyRequest &&
          <div className="flex justify-center items-center pl-3 pr-4 py-3 gap-4 w-full rounded-2xl text-white">
            <div className="w-full h-full bg-[#ffffff21] px-4 py-6 border-l-4 border-primary rounded-xl ">
              {replyRequest.message}
            </div>
            <button onClick={() => setReplyRequest(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </button>
          </div>
        }
        {
          <motion.div
            className="flex justify-center items-center absolute bottom-4 right-4 w-7 h-7 rounded-full bg-primary text-white text-xs"
            initial={{ scale: 0, translateY: 0 }}
            animate={{ scale: newMessageBadge > 0 ? 1 : 0 }}
          >
            {newMessageBadge}
          </motion.div>
        }
      </div>
    </>
  );
}

export default memo(ChatArea)


