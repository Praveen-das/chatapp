"use client";

import React, { memo, useMemo, useRef } from "react";
import moment from "moment";
import { IMessageReadReceipt } from "../../../../enums/enums";
import { useMessageStore } from "../../../../store/messageStore";
import { useStore } from "../../../../store/global";
import { parseUrl } from "@lib/utils";
import { downloadFromUrl } from "@lib/utils";
import useAuth from "@hooks/useAuth";
import { Avatar } from "@components/Dashboard/Components/Avatar";
import Link from "next/link";
import { useConversationStore } from "../../../../store/conversationStore";
import {
  IImageAttachment,
  IMessage,
  IUrlAttachment,
} from "@interfaces/messageInterface";
import ReadReceiptIcons from "./ReadReceiptIcons";
import ImageAttachment from "./ImageAttachment";
import UrlAttachment from "./UrlAttachment";
import Menu from "@components/ui/Menu";
import { EllipsisVerticalIcon,ArrowUturnRightIcon } from "@heroicons/react/24/solid";

interface IChat {
  index: number;
  self: boolean;
  chat: IMessage;
  onReply: (message: IMessage, index: number) => void;
  onClickReply: (index: number) => void;
  style?: any;
  nextMsgIsFromDifferentUser?: boolean;
}

function checkEmoji(emoji: string) {
  const regex = /^\p{Emoji_Presentation}$/u;
  return regex.test(emoji);
}

function getReadReceipt(chat: IMessage) {
  let readReceipt = IMessageReadReceipt[0];
  for (let _value in IMessageReadReceipt) {
    let value = parseInt(_value);
    let _break = false;

    if (!isNaN(value)) {
      let valueExist = chat.readReceipt.some((s) => s.status === value);
      if (valueExist) {
        readReceipt = IMessageReadReceipt[value];
        _break = true;
        break;
      }
    }
    if (_break) break;
  }

  return readReceipt;
}

function Chat({
  index,
  self,
  chat,
  onReply,
  onClickReply,
  style,
  nextMsgIsFromDifferentUser,
}: IChat): JSX.Element {
  const { user } = useAuth();
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const setModal = useStore((s) => s.setModal);
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );

  const isSelected = selectedChats.includes(chat);
  const isEmoji = checkEmoji(chat.message);
  const attachment = chat.attachment!;
  const isGroupConversation = selectedConversation?.host === "group";
  const replyAttachment = chat.reply?.attachment!;
  const replyUser =
    chat.reply?.username === user?.username ? "You" : chat.reply?.username;
  const shouldRenderTimestamp = chat.from !== "system";

  const readReceipt = useMemo(
    () =>
      selectedConversation?.host === "user"
        ? IMessageReadReceipt[chat.readReceipt[0]?.status || 0]
        : getReadReceipt(chat),
    [chat, selectedConversation]
  );

  const options = useMemo(() => {
    const canDownload = attachment?.type === "images";
    return [
      {
        label: isSelected ? "Clear Selection" : "Select",
        handler: () => setSelectedChats(chat),
      },
      canDownload && {
        label: "Download",
        handler: () => {
          if (!attachment) return;
          downloadFromUrl(attachment.url);
        },
      },
      {
        label: "Reply",
        handler: () => onReply(chat, index),
      },
      {
        label: "Delete",
        handler: () => {
          setModal({ activeModal: "deleteMessageModal", state: [chat] });
          document
            ?.querySelector<HTMLDialogElement>("#action-modal")
            ?.showModal();
        },
      },
    ];
  }, [chat, isSelected, attachment]);

  const handleForwadingChat = () => {
    setModal({ activeModal: "forwardMessageModal", state: [chat] });
    document?.querySelector<HTMLDialogElement>("#action-modal")?.showModal();
  };

  const handleReply = () => onClickReply(chat.reply?.offsetTop!);

  const handleSelectedChats = () =>
    selectedChats.length && setSelectedChats(chat);

  const receiver = isGroupConversation
    ? selectedConversation?.members.find((u) => u.id === chat.from)
    : null;

  const haveAttachment =
    (chat.attachment?.type === "link" && chat.attachment.metadata) ||
    chat.attachment?.type === "images";
  const parsedUrl = parseUrl(chat.message);
  const urlHost = parsedUrl?.host;

  return (
    <div
      style={style}
      onClick={handleSelectedChats}
      className={`group ${!!selectedChats.length ? "cursor-pointer" : ""} ${self ? "ml-auto flex-row-reverse" : "mr-auto"} ${isSelected && "bg-black bg-opacity-20"} flex gap-3 text-xs px-1 pt-2 pb-2`}
    >
      {/* chat component */}
      <div
        className={`${self ? "ml-auto" : chat.from === "system" ? "mx-auto" : "mr-auto"} relative flex flex-col max-w-[calc(100%-(1rem+30px))]`}
      >
        <div
          className="grid gap-x-2"
          style={{
            gridTemplateColumns: `${!self && isGroupConversation ? "30px" : "auto"} 1fr`,
          }}
        >
          {/* Avatar */}
          {!self &&
            isGroupConversation &&
            (nextMsgIsFromDifferentUser ? (
              <div className="pt-1 mt-auto">
                <Avatar
                  url={receiver?.profilePicture}
                  profileHidden={Boolean(
                    !receiver?.rules?.profilePicture.isVisible
                  )}
                  size="30px"
                  onlineIndication={false}
                />
              </div>
            ) : (
              <span />
            ))}

          <div
            className={`relative flex flex-col gap-1 ${self ? "ml-auto" : "mr-auto"} ${attachment ? "w-min" : ""}`}
          >
            {/* chat */}
            <div
              className={`relative p-1 text-sm h-full max-w-xl ${haveAttachment ? "" : ""}  ${self ? "bg-primary text-white" : "bg-base-300 shadow-lg text-base-content"} text-base rounded-xl overflow-hidden`}
            >
              {chat.deleted ? (
                <label className="flex px-1 py-1" htmlFor="deleted message">
                  Message deleted
                </label>
              ) : (
                <>
                  {/* reply */}
                  {chat.reply && (
                    <div
                      onClick={handleReply}
                      className={`relative flex gap-2 rounded-xl ${self ? "bg-black/20" : "bg-white/10"} mb-1 z-3 overflow-hidden cursor-pointer`}
                    >
                      {replyAttachment?.type === "images" && (
                        <img
                          className="w-10 h-10 rounded-md"
                          src={replyAttachment.thumbnail}
                          alt=""
                        />
                      )}
                      <div className="flex flex-col gap-[2px] p-2">
                        <label htmlFor="">{replyUser}</label>
                        <p className="text-sm break-all line-clamp-2 pointer-events-none">
                          {chat.reply.message || "Photo"}
                        </p>
                      </div>
                      {replyAttachment?.type === "link" &&
                        replyAttachment.metadata && (
                          <img
                            className="w-32"
                            src={replyAttachment.metadata.image}
                            alt=""
                          />
                        )}
                    </div>
                  )}
                  {/* URL Viewer */}
                  {attachment?.type === "link" && (
                    <div>
                      <UrlAttachment
                        attachment={attachment as IUrlAttachment}
                      />
                    </div>
                  )}
                  {/* ImageAttachment */}
                  {attachment?.type === "images" && (
                    <ImageAttachment
                      attachment={attachment as IImageAttachment}
                    />
                  )}
                  <div
                    className={`px-2 ${chat.message ? (haveAttachment ? "py-2" : "py-1") : ""}`}
                  >
                    {isGroupConversation && !self && (
                      <label className="flex text-[11px] text-primary">
                        {receiver?.username}
                      </label>
                    )}
                    {/* message */}
                    {parsedUrl ? (
                      <Link
                        href={chat.message}
                        target={
                          urlHost !== window.location.host ? "_blank" : ""
                        }
                        className={`flex break-all relative link-hover z-3`}
                      >
                        {chat.message}
                      </Link>
                    ) : (
                      chat.message && (
                        <p
                          className={`relative ${isEmoji && !haveAttachment ? "text-4xl" : ""} break-all z-3`}
                        >
                          {chat.message}
                        </p>
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            {/* action buttons */}
            <div
              className={`flex items-center absolute top-0 bottom-0 ${self ? "-left-[52px] " : "-right-[52px] flex-row-reverse"}`}
            >
              <div
                tabIndex={0}
                onClick={handleForwadingChat}
                className="group-hover:opacity-100 opacity-0 cursor-pointer btn btn-circle btn-ghost btn-xs"
              >
                <ArrowUturnRightIcon className="size-4"/>
              </div>

              {/* dropdown */}
              <Menu
                buttonIcon={
                  <span className="group-hover:opacity-100 opacity-0 btn btn-circle btn-ghost btn-xs">
                    <EllipsisVerticalIcon className="size-5" />
                  </span>
                }
                menuItems={options}
                placement={self ? "bottom-end" : "bottom-start"}
              />
            </div>
          </div>

          <span />

          {/* timestamp and status */}
          {shouldRenderTimestamp && (
            <div
              className={`flex items-center gap-2 whitespace-nowrap ${!self ? "mx-4" : ""} mt-1 text-xs ${self ? "ml-auto" : "mr-auto flex-row-reverse"}`}
            >
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
