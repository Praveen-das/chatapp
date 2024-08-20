"use client";
import useSocket from "../../../../context/SocketProvider";
import React, { Fragment, memo, useCallback, useEffect, useRef, useState } from "react";
import { useMessagesByConversation, useMessageStore } from "../../../../store/messageStore";
import useAuth from '../../../../hooks/useAuth';
import useAuth2 from '../../../../hooks/useAuth2';
import { IMessageReadReceipt } from "../../../../enums/enums";
import { useStore } from "../../../../store/global";
import Chat from "./Chat";
import { VList, VListHandle } from "virtua";
import { motion } from 'framer-motion'
import ChatHeader from "../ChatHeader/ChatHeader";
import { useAttachments } from "../../../../store/attachments";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './swiper.css'
import ImageViewer from "./ImageViewer";
import socket from "../../../../lib/ws";
import { useConversationStore } from "../../../../store/conversationStore";

function ChatArea() {
  const { user } = useAuth();
  const users = useStore(s => s.users)

  const selectedConversation = useConversationStore(s => s.selectedConversation);
  const { messageHistory, messages, unreadMessages } = useMessagesByConversation()
  const getUnreadMessages = useMessageStore(s => s.getUnreadMessages);
  const clearUnreadMessages = useMessageStore(s => s.clearUnreadMessages);
  const getMessages = useMessageStore(s => s.getUserMessages);
  const replyRequest = useMessageStore(s => s.replyRequest);
  const setReplyRequest = useMessageStore(s => s.setReplyRequest);

  const [newMessageBadge, setNewMessageBadge] = useState(0);

  const listRef = useRef<VListHandle>(null);
  const lastReadMsgIndex = useRef(0)
  const isFocused = useRef(true)
  const initialValue = useRef(0)
  const isScrolledToBottom = useRef(true)
  const haveNewMessages = useRef(!!unreadMessages.length)
  const lastMessageReference = useRef<IMessage | null>(null)

  const conversationId = selectedConversation?.id || '';

  useEffect(() => {
    const _unreadMessages = getUnreadMessages(conversationId)
    const messages = getMessages(conversationId) || []
    const _messageHistory = useMessageStore.getState().messageHistory.get(conversationId) || []

    const totalMessages = _messageHistory.length + messages.length

    if (!!_unreadMessages.length) {
      isScrolledToBottom.current = false
      haveNewMessages.current = true
    }

    lastReadMsgIndex.current = messages.length - _unreadMessages.length

    const scrollToIndex = totalMessages - _unreadMessages.length

    queueMicrotask(() => listRef.current?.scrollToIndex(scrollToIndex, { align: 'center' }))

    initialValue.current = messages.length

    return () => {
      clearUnreadMessages(conversationId)
      isScrolledToBottom.current = true
      haveNewMessages.current = false
      initialValue.current = 0
      isFocused.current = true
      // socket.selectedConversation = null
    };
  }, [selectedConversation, user]);

  //////////////////// send readreceiptChangeRequest
  useEffect(() => {
    const updates: IUpdates = new Map();
    const _unreadMessages = getUnreadMessages(conversationId)

    const status = user?.rules?.readReceipts.isVisible ? IMessageReadReceipt.seen : IMessageReadReceipt.unseen

    for (let { id, from } of _unreadMessages || []) {

      const isReceiver = from !== user?.id;

      if (isReceiver) {
        let update: IUpdatesCollection = {
          id,
          readReceipt: [{ userId: user?.id!, status }]
        };

        let key = { conversationId, to: from };

        updates.upsert(key, update);
      }

      useSocket.getState().sendReadReceiptChangeRequest(updates)
    }
  }, [user, selectedConversation])

  /////////setNewMessageBadge
  useEffect(() => {
    if (!isFocused.current)
      setNewMessageBadge(unreadMessages.length - initialValue.current)
    if (!unreadMessages.length) {
      initialValue.current = 0
      haveNewMessages.current = false
    }
  }, [unreadMessages])

  useEffect(() => {
    const recentMessage = messages.at(-1) || null

    const self = recentMessage?.from === user?.id && recentMessage?.id !== lastMessageReference.current?.id

    let index = messages.length + messageHistory.length

    if (!haveNewMessages.current) lastReadMsgIndex.current = messages.length - 1

    if (isScrolledToBottom.current || (self && recentMessage?.from !== 'system')) listRef.current?.scrollToIndex(index, { align: 'end' });

    lastMessageReference.current = recentMessage
    return () => {
      haveNewMessages.current = false
    }
  }, [messageHistory, messages, user])

  //////////////////// handle scroll
  const handleScroll = (offset: number) => {
    const list = listRef.current

    if (!list) return

    const scrollOffset = list.viewportSize! + offset
    const itemOffset = list.getItemOffset(messageHistory.length + lastReadMsgIndex.current)!
    const lastItemOffset = list.getItemOffset(messageHistory.length + messages.length)

    if (scrollOffset === lastItemOffset) isScrolledToBottom.current = true
    else isScrolledToBottom.current = false

    if (scrollOffset > itemOffset) {
      setNewMessageBadge(0)
      initialValue.current = unreadMessages.length
      isFocused.current = true
    } else {
      isFocused.current = false
    }
  }

  const handleReply = useCallback(({ message, attachment, from }: IMessage, index: number) => {
    const username = users.find(u => u.id === from)?.username!

    const req = {
      username,
      message,
      attachment,
      offsetTop: listRef.current?.getItemOffset(index) || 0,
    }

    setReplyRequest(req)
  }, [users, users])

  const handleScrollToIndex = useCallback((index: number) => listRef.current?.scrollTo(index), [])

  return (
    <>
      <ImageViewer />
      <div className='flex flex-col relative h-full overflow-hidden bg-gradient-to-t from-base-100 shadow-lg rounded-2xl'>
        <div className='flex flex-col w-full h-full overflow-y-scroll no-scrollbar'>
          <VList
            reverse
            ref={listRef}
            onScroll={handleScroll}
            style={{ height: '100%' }}
            className="overflow-y-scroll no-scrollbar"
          >
            {
              messageHistory.map((chat, index) => {

                if (!chat) return <></>

                const self = user?.id === chat.from;

                return (
                  <Chat
                    index={index}
                    key={chat.id}
                    onReply={handleReply}
                    self={self}
                    chat={chat}
                    onClickReply={handleScrollToIndex}
                  />
                )
              })
            }
            {
              !!messages.length &&
              messages.map((chat, index) => {

                if (!chat) return <></>

                const self = user?.id === chat.from;

                return (
                  <Fragment key={chat.id}>
                    {
                      haveNewMessages.current &&
                      index === lastReadMsgIndex.current &&

                      <div className="flex justify-center">
                        <div className={`w-full py-3 text-sm my-2 bg-primary flex justify-center items-center  `}>
                          {unreadMessages.length} Unread messages
                        </div>
                      </div>
                    }
                    {
                      chat.from === 'system' ?
                        <div className="flex justify-center px-4 my-2 pointer-events-none">
                          <label className="py-1 px-2 w-max text-xs bg-base-300 rounded-2xl  text-center" htmlFor="">{chat.message}</label>
                        </div>
                        :
                        < Chat
                          index={index}
                          key={chat.id}
                          onReply={handleReply}
                          self={self}
                          chat={chat}
                          onClickReply={handleScrollToIndex}
                        />
                    }
                  </Fragment>
                )
              })
            }
          </VList>
        </div>
        {
          replyRequest &&
          <div className="flex justify-center items-center pl-3 pr-4 py-3 gap-4 w-full rounded-2xl ">
            <div className="w-full h-full bg-base-300 px-4 py-6 border-l-4 border-primary rounded-xl ">
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
            className="flex justify-center items-center absolute bottom-4 right-4 w-7 h-7 rounded-full bg-primary  text-xs"
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

