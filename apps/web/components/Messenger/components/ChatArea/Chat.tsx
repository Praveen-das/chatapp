"use client";

import React, { memo, useMemo, useRef } from "react";
import moment from 'moment';
import { IMessageReadReceipt } from "../../../../enums/enums";
import { Menu } from "@headlessui/react";
import { flip, useFloating } from '@floating-ui/react';
import { useMessages } from "../../../../store/messageStore";
import { useStore } from "../../../../store/global";

interface IChat {
  index: number;
  self: boolean;
  chat: IMessage;
  onReply: (message: string, index: number) => void
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
  const selectedChats = useMessages(s => s.selectedChats)
  const setSelectedChats = useMessages(s => s.setSelectedChats)
  const setModalState = useStore(s => s.setModalState)
  const chatRef = useRef<HTMLDivElement>(null)

  const readReceipt = chat.host === 'user' ? IMessageReadReceipt[chat.readReceipt[0]?.status || 0] : getReadReceipt(chat)
  const isSelected = selectedChats.includes(chat)
  const isEmoji = checkEmoji(chat.message)

  const { refs, floatingStyles } = useFloating({
    middleware: [flip()],
    placement: 'bottom-start',
  });

  const options = useMemo(() => [
    {
      label: isSelected ? 'Clear Selection' : 'Select',
      handler: () => setSelectedChats(chat)
    },
    {
      label: 'Reply',
      handler: () => onReply(chat.message, index)
    },
    {
      label: 'Delete',
      handler: () => {
        setSelectedChats(chat)
        setModalState('deleteMessageModal')
      }
    },
  ], [chat, isSelected])

  const handleReply = () => onClickReply(chat.reply?.offsetTop!)

  const handleSelectedChats = () => {
    selectedChats.length && setSelectedChats(chat)
  }

  return (
    <div
      style={{ ...style }}
      onClick={handleSelectedChats}
      ref={chatRef}
      className={`${!!selectedChats.length && 'cursor-pointer'} ${self ? 'ml-auto flex-row-reverse' : 'mr-auto'} px-4 pt-2 pb-1 ${isSelected && 'bg-black bg-opacity-20'} flex gap-3 text-white text-xs`}
    >
      {
        !self && chat.host === 'group' &&
        <div className="avatar">
          <div className="size-8 rounded-full">
            <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
          </div>
        </div>
      }
      <div className={`group ${self ? 'ml-auto' : 'mr-auto'} relative flex flex-col w-max`}>
        <div className={`relative w-full h-full ${self ? "bg-primary" : "bg-zinc-900"} rounded-2xl p-2 overflow-hidden`}>
          {
            chat.reply &&
            <div onClick={handleReply} className="relative p-2 w-full rounded-xl bg-[#ffffff21] mb-1 z-3 cursor-pointer">
              <p className="text-sm break-all mx-1 pointer-events-none">{chat.reply.message}</p>
            </div>
          }
          {
            chat.attachment &&
            <AttachmentBox attachment={chat.attachment} />
          }
          <p className={`relative ${isEmoji ? 'text-4xl' : 'text-base'} break-all z-3 mx-1 max-w-md`}>{chat.message}</p>
          <span className={`absolute -top-1 -right-1 w-8 h-6 ${self ? "bg-primary" : "bg-zinc-900"} shadow-[0_0_30px_30px] ${self ? "shadow-primary" : "shadow-zinc-900"} rounded-full opacity-0 group-hover:opacity-100 duration-300`} />
        </div>
        <div className={`flex items-center gap-2 mx-1 mt-1 text-xs ${self ? 'ml-auto' : 'mr-auto flex-row-reverse'}`}>
          <label htmlFor="">{moment(new Date(chat.timestamp)).format('LT')}</label>
          {self && <ReadReceiptIcons readReceipt={readReceipt} />}
        </div>
        <div className="absolute top-2 right-1 text-left">
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button
              ref={refs.setReference}
              className="group-hover:opacity-100 outline-none duration-300 text-white rounded-full opacity-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </Menu.Button>
            <Menu.Items
              className="absolute right-0 w-28 origin-top-right divide-y divide-gray-100 rounded-md bg-zinc-700 shadow-lg ring-1 ring-black/5 focus:outline-none z-10"
              ref={refs.setFloating}
              style={floatingStyles}
            >
              <div className="p-0.5">
                {
                  options.map((option, i) => (
                    <Menu.Item key={i}>
                      <button
                        className={`group hover:bg-zinc-500 hover:text-white flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        onClick={option.handler}
                      >
                        {option.label}
                      </button>
                    </Menu.Item>
                  ))
                }
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </div >
  );
}

interface IAttachmentBox {
  attachment: IAttachment
}

const AttachmentBox = ({ attachment }: IAttachmentBox) => {

  const renderAttachment = {
    image: <ImageAttachment attachment={attachment} />
  }

  return (
    <div>
      {renderAttachment[attachment.type]}
    </div>
  )
}

const ImageAttachment = ({ attachment }: IAttachmentBox) => {
  return (
    <div className="max-h-[350px] max-w-[350px] overflow-hidden mb-2 rounded-lg">
      <img src={attachment.thumbnail} className={`${attachment.isUploaded ? 'blur-none' : 'blur'} duration-200 h-full`} alt="" />
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
  if (readReceipt === 'received')
    return (
      <div className={`flex`}>
        <div className={`size-[6px] rounded-full bg-white -translate-x-[2px]`} />
        <div className={`size-[6px] rounded-full bg-white`} />
      </div>
    )
  return <div className={`size-[6px] rounded-full bg-white`} />

}

export default memo(Chat)






