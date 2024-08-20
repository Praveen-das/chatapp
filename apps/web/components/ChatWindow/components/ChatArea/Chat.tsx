"use client";

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import moment from 'moment';
import { IMessageReadReceipt } from "../../../../enums/enums";
import { Menu } from "@headlessui/react";
import { flip, useFloating } from '@floating-ui/react';
import { useMessageStore } from "../../../../store/messageStore";
import { useStore } from "../../../../store/global";
import { downloadFromUrl, isSameHost, isValidURL, parseUrl } from "../../../../helpers/helpers";
import { useAttachments } from "../../../../store/attachments";
import ImageAttachment from "./ImageAttachment";
import { motion } from 'framer-motion'
import useAuth from "../../../../hooks/useAuth";
import { Avatar } from "../../../Dashboard/Components/Avatar";
import Link from "next/link";
import UrlAttachment from "./UrlAttachment";
import LinkPreview from "../../../ui/LinkPreview";

interface IChat {
  index: number;
  self: boolean;
  chat: IMessage;
  onReply: (message: IMessage, index: number) => void
  onClickReply: (index: number) => void
  style?: any
}

const getReadReceipt = (chat: IMessage) => {
  let readReceipt = IMessageReadReceipt[0]
  for (let _value in IMessageReadReceipt) {
    let value = parseInt(_value)
    let _break = false

    if (!isNaN(value)) {
      let valueExist = chat.readReceipt.some((s) => s.status === value);
      if (valueExist) {
        readReceipt = IMessageReadReceipt[value]
        _break = true
        break
      }
    }
    if (_break) break
  }

  return readReceipt
}

const checkEmoji = (emoji: string) => {
  const regex = /^[\p{Emoji}]$/u;
  return regex.test(emoji)
}

function Chat(
  {
    index,
    self,
    chat,
    onReply,
    onClickReply,
    style
  }: IChat): JSX.Element {

  const { user } = useAuth()
  const selectedChats = useMessageStore(s => s.selectedChats)
  const setSelectedChats = useMessageStore(s => s.setSelectedChats)
  const setModal = useStore(s => s.setModal)
  const users = useStore(s => chat.host === 'group' ? s.users : [])
  const chatRef = useRef<HTMLDivElement>(null)

  const readReceipt = chat.host === 'user' ? IMessageReadReceipt[chat.readReceipt[0]?.status || 0] : getReadReceipt(chat)
  const isSelected = selectedChats.includes(chat)
  const isEmoji = checkEmoji(chat.message)

  const attachment = chat.attachment!
  const replyAttachment = chat.reply?.attachment!

  const { refs, floatingStyles } = useFloating({
    middleware: [flip()],
    placement: 'bottom-start',
  });

  const options = useMemo(() => [
    {
      label: isSelected ? 'Clear Selection' : 'Select',
      handler: () => setSelectedChats(chat)
    },
    attachment?.type === 'images' && {
      label: 'Download',
      handler: () => {
        if (!attachment) return
        downloadFromUrl(attachment.url)
      }
    },
    {
      label: 'Reply',
      handler: () => onReply(chat, index)
    },
    {
      label: 'Delete',
      handler: () => {
        setModal({ activeModal: 'deleteMessageModal', state: [chat] });
        (document?.getElementById('action-modal') as HTMLDialogElement)?.showModal()
      }
    }
  ], [chat, isSelected])

  const handleReply = () => onClickReply(chat.reply?.offsetTop!)

  const handleSelectedChats = () => {
    selectedChats.length && setSelectedChats(chat)
  }

  const receiver = chat.host === 'group' ? users.find(u => u.id === chat.from) : null
  const haveAttachment = (chat.attachment?.type === 'link' && chat.attachment.metadata) || chat.attachment?.type === 'images'
  const parsedUrl = parseUrl(chat.message)
  const urlHost = parsedUrl?.host

  return (
    <div
      style={{ ...style }}
      onClick={handleSelectedChats}
      ref={chatRef}
      className={`${!!selectedChats.length ? 'cursor-pointer' : ''} ${self ? 'ml-auto flex-row-reverse' : 'mr-auto'} ${isSelected && 'bg-black bg-opacity-20'} flex gap-3 text-xs px-4 pt-2 pb-1`}
    >
      {
        !self && chat.host === 'group' &&
        <div className="pt-1">
          <Avatar profileHidden={Boolean(!receiver?.rules?.profilePicture.isVisible)} size="30px" onlineIndication={false} />
        </div>
      }

      {/* chat component */}
      <div className={`group ${self ? 'ml-auto' : chat.from === 'system' ? 'mx-auto' : 'mr-auto'} relative flex flex-col w-max`}>

        {/* chat */}
        <div className={`relative h-full max-w-xl ${haveAttachment ? 'w-min' : ''}  ${self ? "bg-primary text-white" : "bg-base-300 shadow-lg text-base-content"} rounded-2xl p-1 overflow-hidden`}>

          {/* reply */}
          {chat.reply && <div onClick={handleReply} className={`relative flex gap-2 rounded-xl ${self ? 'bg-black/20' : 'bg-white/10'} mb-1 z-3 overflow-hidden cursor-pointer`}>
            {replyAttachment?.type === 'images' && <img className="w-10 h-10 rounded-md" src={replyAttachment.thumbnail} alt="" />}
            <div className="flex flex-col gap-[2px] p-2">
              <label htmlFor="">{chat.reply.username === user?.username ? 'You' : chat.reply.username}</label>
              <p className="text-sm break-all line-clamp-2 pointer-events-none">{chat.reply.message || 'Photo'}</p>
            </div>
            {(replyAttachment?.type === 'link' && replyAttachment.metadata) && <img className="w-32" src={replyAttachment.metadata.image} alt="" />}
          </div>}

          {/* Attachment viewer */}
          {chat.attachment && <AttachmentBox attachment={chat.attachment} />}

          {/* message */}
          {
            parsedUrl ?
              <Link href={chat.message} target={urlHost !== window.location.host ? '_blank' : ''} className={`relative link-hover ${isEmoji ? 'text-4xl' : 'text-base'} break-all z-3 mx-2 py-1`}>{chat.message}</Link> :
              <p className={`relative ${isEmoji ? 'text-4xl' : 'text-base'} break-all z-3 mx-2 py-1`}>{chat.message}</p>
          }
        </div>

        {
          chat.from !== 'system' &&
          <>
            {/* timestamp and status */}
            < div className={`flex items-center gap-2 mx-1 mt-1 text-xs ${self ? 'ml-auto' : 'mr-auto flex-row-reverse'}`}>
              <label htmlFor="">{moment(new Date(chat.timestamp)).format('LT')}</label>
              {self && <ReadReceiptIcons readReceipt={readReceipt} />}
            </div>

            {/* dropdown */}
            <div className="absolute top-1 right-1 text-left">
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button ref={refs.setReference} className="group-hover:opacity-100 outline-none duration-300 text-white rounded-full opacity-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </Menu.Button>
                <Menu.Items
                  className="absolute right-0 w-28 origin-top-right divide-y divide-gray-100 rounded-md bg-base-100 shadow-lg ring-1 ring-black/5 focus:outline-none z-10"
                  ref={refs.setFloating}
                  style={floatingStyles}
                >
                  <div className="p-0.5">
                    {
                      options.map((option, i) => (
                        option ? <Menu.Item key={i}>
                          <div
                            className={`group btn btn-md w-full h-10 min-h-10 btn-ghost justify-start`}
                            onClick={option.handler}
                          >
                            {option.label}
                          </div>
                        </Menu.Item> : null
                      ))
                    }
                  </div>
                </Menu.Items>
              </Menu>
            </div>
          </>
        }

      </div>
    </div >
  );
}

const AttachmentBox = ({ attachment }: IAttachmentBox) => {
  const renderAttachment = {
    images: <ImageAttachment attachment={attachment as IImageAttachment} />,
    link: <UrlAttachment attachment={attachment as IUrlAttachment} />
  }

  return (
    <div>
      {renderAttachment[attachment.type as keyof typeof renderAttachment]}
    </div>
  )
}

const ReadReceiptIcons = ({ readReceipt }: { readReceipt?: string }) => {

  if (readReceipt === 'seen')
    return (
      <div className={`flex`}>
        <div className={`size-[6px] rounded-full bg-primary -translate-x-[2px]`} />
        <div className={`size-[6px] rounded-full bg-primary`} />
      </div>
    )
  if (readReceipt === 'received' || readReceipt === 'unseen')
    return (
      <div className={`flex`}>
        <div className={`size-[6px] rounded-full bg-black/50 -translate-x-[2px]`} />
        <div className={`size-[6px] rounded-full bg-black/50`} />
      </div>
    )
  return <div className={`size-[6px] rounded-full bg-black/50`} />

}

export default memo(Chat)






