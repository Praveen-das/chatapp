"use client";

import React, {
  MouseEvent,
  ReactNode,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import moment from "moment";
import { IMessageReadReceipt } from "../../../../enums/enums";
import { useMessageStore } from "../../../../store/messageStore";
import { useStore } from "../../../../store/global";
import { parseUrl } from "@lib/utils";
import { downloadFromUrl } from "@lib/utils";
import Avatar from "@components/ui/Avatar";
import Link from "next/link";
import { useConversationStore } from "../../../../store/conversationStore";
import {
  IImageAttachment,
  IMessage,
  IMessageReply,
  IReadReceipt,
  IUrlAttachment,
} from "@interfaces/messageInterface";
import ReadReceiptIcons from "./ReadReceiptIcons";
import ImageAttachment from "./ImageAttachment";
import UrlAttachment from "./UrlAttachment";
import { ArrowUturnLeftIcon, SparklesIcon } from "@heroicons/react/24/solid";
import useAuth from "@hooks/useAuth";
import { PhotoIcon, StarIcon } from "@heroicons/react/16/solid";
import { decrypt } from "@lib/e2e";

export interface IChat {
  self: boolean;
  chat: IMessage;
  reply?: IMessageReply;
  onReply?: (chat: IMessage) => void;
  onClickReply?: (messageId: string) => void;
  displayAvatar?: boolean;
  hideAvatar?: boolean;
  displayUsername?: boolean;
  style?: any;
  isSelected?: boolean;
  canSelect?: boolean;
  menuButton?: ReactNode;
  noColorChange?: boolean;
  isStarred?: boolean;
}

function checkEmoji(emoji: string) {
  const regex = /^\p{Emoji_Presentation}$/u;
  return regex.test(emoji);
}

function getReadReceipt(readReceipts: IReadReceipt[]) {
  let result;

  for (let num in IMessageReadReceipt) {
    let value = parseInt(num);
    let _break = false;

    if (!isNaN(value)) {
      let valueExist = readReceipts.some((receipt) => receipt.status === value);
      if (valueExist) {
        result = IMessageReadReceipt[value];
        _break = true;
        break;
      }
    }

    if (_break) break;
  }

  return result;
}

function Chat({
  self,
  chat,
  reply,
  onReply,
  onClickReply,
  displayAvatar = false,
  hideAvatar = false,
  displayUsername = false,
  style,
  isSelected,
  canSelect,
  menuButton,
  noColorChange = false,
  isStarred = false,
}: IChat): JSX.Element {
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );

  const attachment = chat.attachment!;

  const shouldRenderTimestamp = chat.from !== "system";
  const receiver = chat.user;
  const haveAttachment = !!chat.attachment;
  const isEncrypted = Boolean(chat.message) || chat.from !== "system";
  const messageString = isEncrypted ? decrypt(chat.message) : chat.message;
  const isEmoji = checkEmoji(messageString);

  const readReceipt = useMemo(
    () => getReadReceipt(chat.readReceipt),
    [chat, selectedConversation]
  );

  const handleReply = () => {
    onClickReply?.(reply?.messageId!);
  };

  const canShowAttachment =
    attachment &&
    (attachment.type === "link"
      ? Boolean(attachment.metadata)
      : attachment.url);

  return (
    <div
      id="chat_message"
      style={style}
      className={` group ${canSelect ? "cursor-pointer" : ""} ${self ? "ml-auto flex-row-reverse" : "mr-auto"} ${isSelected && "bg-black bg-opacity-20"} flex gap-3 text-xs px-4 pt-2 pb-2`}
    >
      {/* chat component */}
      <div
        className={`${self ? "ml-auto" : chat.from === "system" ? "mx-auto" : "mr-auto"} relative flex flex-col max-w-[calc(100%-(1rem+30px))]`}
      >
        <div
          className={`grid ${displayAvatar ? "grid-cols-[30px_1fr] gap-x-2" : ""} ${self ? "justify-items-end" : "justify-items-start"}`}
        >
          {/* Avatar */}
          {displayAvatar && (
            <div className={`row-span-2`}>
              {hideAvatar ? (
                <span />
              ) : (
                <Avatar
                  url={receiver?.profilePicture}
                  profileHidden={Boolean(
                    !receiver?.rules?.profilePicture.isVisible
                  )}
                  size="30px"
                  onlineIndication={false}
                />
              )}
            </div>
          )}

          <div
            className={`relative flex flex-col gap-1 ${canShowAttachment ? "w-min" : ""}`}
          >
            {attachment?.type === "images" && (
              <ImageAttachment attachment={attachment as IImageAttachment} />
            )}

            {/* chat */}
            <div
              className={`${!chat.message ? "hidden" : ""} relative text-sm h-full max-w-xl ${isEmoji && !haveAttachment ? "" : self || noColorChange ? "bg-primary text-white" : "bg-base-300 shadow-lg text-base-content"} text-base rounded-2xl overflow-hidden`}
            >
              {chat.deleted ? (
                <label
                  className="flex px-1 py-1 whitespace-nowrap"
                  htmlFor="deleted message"
                >
                  Message deleted
                </label>
              ) : (
                <>
                  {/* reply */}
                  {reply && (
                    <ReplyMessage reply={reply} onClick={handleReply} />
                  )}

                  {/* URL Viewer */}
                  {attachment?.type === "link" && (
                    <UrlAttachment attachment={attachment as IUrlAttachment} />
                  )}

                  {/* message */}
                  <div
                    className={`${isEmoji && !haveAttachment ? "" : "px-3"} ${chat.message ? (haveAttachment ? "py-2" : "py-1") : "hidden"}`}
                  >
                    {displayUsername && (
                      <label className="flex text-[11px] text-primary">
                        {receiver?.username}
                      </label>
                    )}

                    <RenderMessage text={messageString} isEmoji={isEmoji} />
                  </div>
                </>
              )}
            </div>

            {/* action buttons */}
            {!canSelect && (
              <div
                className={`max-sm:hidden flex items-center absolute top-0 bottom-0 ${self ? "-left-1 -translate-x-full" : "-right-1 translate-x-full flex-row-reverse"}`}
              >
                {!chat.deleted && (
                  <>
                    <div
                      tabIndex={0}
                      onClick={() => onReply?.(chat)}
                      className="group-hover:opacity-100 opacity-0 cursor-pointer btn btn-circle btn-ghost btn-xs"
                    >
                      <ArrowUturnLeftIcon className="size-4" />
                    </div>
                    {/* <div className="group-hover:opacity-100 opacity-0 cursor-pointer btn btn-circle btn-ghost btn-xs">
                      <SparklesIcon className="size-4" />
                    </div> */}
                  </>
                )}
                {/* dropdown */}
                {menuButton}
              </div>
            )}
          </div>

          {/* timestamp and status */}
          {shouldRenderTimestamp && (
            <div
              className={`flex items-center gap-2 whitespace-nowrap mx-1 mt-1 text-xs ${!self ? "flex-row-reverse" : ""}`}
            >
              {isStarred && <StarIcon className="size-3 text-black/50" />}
              <label htmlFor="">
                {moment(new Date(chat.timestamp)).format("LT")}
              </label>
              {self && <ReadReceiptIcons readReceipt={readReceipt} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(Chat);

function RenderMessage({ text, isEmoji }: { text: string; isEmoji: boolean }) {
  const parsedUrl = parseUrl(text);
  const isUrl = Boolean(parsedUrl);
  const samesite = isUrl && parsedUrl?.host === window.location.host;

  function handleOpeningModal(e: MouseEvent<HTMLAnchorElement>) {
    if (!samesite) return;
    e.preventDefault();

    const invitationId =
      parsedUrl.pathname.includes("/invite/") &&
      parsedUrl.pathname.split("/invite/")[1];

    if (!invitationId) return;

    useStore.getState().setModal({
      activeModal: "joinGroupModal",
      state: { invitationId },
      open: true,
    });
  }

  return (
    <>
      {isUrl ? (
        <Link
          onClick={handleOpeningModal}
          href={text}
          target={!samesite ? "_blank" : ""}
          className={`flex break-all relative link-hover z-3`}
        >
          {text}
        </Link>
      ) : (
        <p
          className={`whitespace-pre-wrap relative ${isEmoji ? "text-5xl" : ""} break-all z-3`}
        >
          {text}
        </p>
      )}
    </>
  );
}

function ReplyMessage({
  reply,
  onClick,
}: {
  reply: IMessageReply;
  onClick: () => void;
}) {
  const { user } = useAuth();
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );
  const replyAttachment = reply.attachment;
  const sender = selectedConversation?.members.find(
    (m) => m.id === reply.userId
  );
  const self = user?.id === sender?.id;
  const messageString = reply.message ? decrypt(reply.message) : null;

  return (
    <div
      onClick={onClick}
      className={`relative flex rounded-xl ${self ? "bg-black/20" : "bg-white/10"} mb-1 z-3 overflow-hidden cursor-pointer`}
    >
      {replyAttachment?.type === "images" && (
        <img
          className="h-20 rounded-md"
          src={replyAttachment.thumbnailUrl}
          alt=""
        />
      )}
      <div className="flex flex-col gap-[2px] py-2 pl-2 pr-4">
        <label className="text-xs" htmlFor="">
          {self ? "You" : sender?.username}
        </label>
        <p className="flex items-center gap-1 text-sm break-all line-clamp-2 pointer-events-none">
          {messageString || (
            <>
              {replyAttachment?.type === "images" && (
                <PhotoIcon className="size-4" />
              )}
              Image
            </>
          )}
        </p>
      </div>
      {replyAttachment?.type === "link" && replyAttachment.metadata && (
        <img className="w-32" src={replyAttachment.metadata.image} alt="" />
      )}
    </div>
  );
}
