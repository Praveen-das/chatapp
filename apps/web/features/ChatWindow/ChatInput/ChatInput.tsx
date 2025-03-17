"use client";
import React, { ChangeEvent, memo, useEffect, useRef, useState } from "react";
import { Popover } from "@headlessui/react";

import useSocket from "../../../context/SocketProvider";
import { useMessageStore } from "../../../store/messageStore";
import useAuth from "@hooks/useAuth";
import { useStore } from "../../../store/global";
import EmojiPicker from "../../ui/EmojiPicker";
import { parseUrl } from "@lib/utils";
import { useAttachments } from "../../../store/attachments";
import InputButton from "../../ui/InputButton";
import { useConversationStore } from "../../../store/conversationStore";
import useSelectedConversation from "@hooks/useSelectedConversation";
import LinkPreview from "../../ui/LinkPreview";
import { getUrlMetadata } from "@lib/fetchers";
import { getImages } from "@lib/utils";
import { SendSolid } from "iconoir-react";
import {
  ArrowUturnRightIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import socket from "@lib/ws";
import { handleGeneratingConversation } from "@lib/conversation";
import { IUrlAttachment } from "@interfaces/messageInterface";
import ObjectID from "bson-objectid";
import { generateMessageTemplate } from "@lib/messages";
import ImageAttachmentPreview from "./AttachmentPreview/ImageAttachmentPreview";
import UrlAttachmentPreview from "./AttachmentPreview/UrlAttachmentPreview";
import { decrypt } from "@lib/e2e";
import { ai } from "@lib/openAI";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import useUrlParser from "./useUrlParser";

function ChatInput() {
  const { user } = useAuth();
  const conversationId = useConversationStore((s) => s.selectedConversation)?.id!;
  const selectedConversation = useSelectedConversation(conversationId);

  const isBlockedConversation = selectedConversation?.host === "user" && selectedConversation.blocked;
  const isGroup = selectedConversation?.host === "group";
  const isMember = selectedConversation?.members.some((m) => m.id === user?.id);

  return (
    <div className="flex flex-col w-full mx-auto shadow-lg bg-base-200 sm:rounded-2xl">
      {isBlockedConversation ? (
        <BlockedUserNotification username={selectedConversation?.conversationId!} />
      ) : isGroup ? (
        isMember ? (
          <InputWrapper />
        ) : (
          <UnavailableConversation />
        )
      ) : (
        <InputWrapper />
      )}
    </div>
  );
}

function InputWrapper() {
  const selectedChats = useMessageStore((s) => s.selectedChats);
  return (
    <>
      <div className="max-sm:hidden">{!!selectedChats.length ? <SelectedMessagesActions /> : <Input />}</div>
      <div className="sm:hidden duration-300">
        <Input />
      </div>
    </>
  );
}

function Input(): React.ReactNode {
  const { user } = useAuth();
  const setReplyRequest = useMessageStore((s) => s.setReplyRequest);
  const replyRequest = useMessageStore((s) => s.replyRequest);
  const selectedConversation = useConversationStore.getState().selectedConversation;

  const { sendMessage } = useSocket();
  const [messageString, setMessageString] = useState("");
  const [open, setOpen] = useState(false);

  const { metadata, setMetadata } = useUrlParser(messageString);

  const sender = selectedConversation?.members.find((m) => m.id === replyRequest?.userId);
  const receiver = sender?.id === user?.id ? "You" : sender?.username!;
  const replyMessage = replyRequest?.message ? decrypt(replyRequest.message) : null;

  const handleEmoji = (emoji: any) => {
    setMessageString((s) => s.concat(emoji.native));
  };

  function handleInput(e: ChangeEvent<HTMLTextAreaElement>) {
    if (e.target.scrollHeight < 75) {
      e.target.style.height = "auto";
      e.target.style.height = e.target.scrollHeight + "px";
    }
    setMessageString(e.target.value);
  }

  const handleMessaging = () => {
    if (!messageString) return;

    const selectedConversation = useConversationStore.getState().selectedConversation;
    const conversations = useConversationStore.getState().conversations;
    const selectedUser = useStore.getState().selectedUser;
    const setSelectedUser = useStore.getState().setSelectedUser;

    let conversation = conversations.find(
      (c) =>
        c.id === selectedConversation?.id || (c.members.find((m) => m.id === selectedUser?.id!) && c.host === "user")
    );

    const url = parseUrl(messageString);

    const attachment: IUrlAttachment | undefined = url
      ? {
          metadata,
          type: "link",
          id: new ObjectID().toHexString(),
          url: messageString,
          host: url.host,
        }
      : undefined;

    const message = generateMessageTemplate(conversation!, messageString, attachment);

    sendMessage(conversation!, [message]);

    setSelectedUser(null);
    setMessageString("");
    setReplyRequest(null);
    setOpen(false);
  };

  return (
    <div>
      {replyRequest && (
        <div className="flex justify-center items-center p-2 pr-4 gap-4 w-full rounded-2xl ">
          <div className="w-full h-full flex justify-between bg-base-300 rounded-xl ">
            {replyRequest.attachment ? (
              replyRequest.attachment.type === "images" ? (
                <ImageAttachmentPreview url={replyRequest.attachment.url} receiver={receiver} text={replyMessage} />
              ) : (
                replyRequest.attachment.type === "link" && (
                  <UrlAttachmentPreview
                    metadata={replyRequest.attachment.metadata}
                    receiver={receiver}
                    text={replyMessage}
                  />
                )
              )
            ) : (
              <div className={`w-full h-full text-sm grid p-2 py-4 gap-1`}>
                <span className="text-xs text-primary">{receiver}</span>
                {replyMessage}
              </div>
            )}
          </div>
          <button onClick={() => setReplyRequest(null)}>
            <XMarkIcon className="size-6" />
          </button>
        </div>
      )}

      {metadata && (
        <div className="flex items-center p-2">
          <LinkPreview metadata={metadata} link={messageString} />
          <div
            onClick={() => setMetadata(undefined)}
            tabIndex={0}
            className="btn btn-circle btn-sm btn-ghost ml-4 mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
        </div>
      )}

      <EmojiPicker open={open} onEmojiSelect={handleEmoji} />
      <div className="flex items-center gap-1 w-full mx-auto p-4">
        <AttachmentPicker />
        <div onClick={() => setOpen((s) => !s)} className="btn btn-circle btn-ghost btn-sm">
          <FaceSmileIcon className="size-6" />
        </div>

        <textarea
          rows={1}
          value={messageString}
          onChange={handleInput}
          className="w-full bg-transparent outline-none border-none ml-3 overflow-hidden resize-none"
        />
        <div className="btn btn-circle btn-sm btn-ghost" onClick={handleMessaging} tabIndex={0}>
          <SendSolid className="size-6" />
        </div>
      </div>
    </div>
  );
}

function AttachmentPicker() {
  const popoverRef = useRef<HTMLInputElement>(null);
  const addImages = useAttachments((s) => s.addImages);

  async function handleImportingImages(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const payload = await getImages(files);
    if (payload) addImages(payload);
  }

  return (
    <>
      <Popover as="div" className="relative inline-block text-left ml-auto">
        <Popover.Button className="btn btn-sm btn-circle btn-ghost outline-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
            />
          </svg>
        </Popover.Button>
        <Popover.Panel
          ref={popoverRef}
          className="grid absolute bottom-10 -left-1/2 z-10 whitespace-nowrap rounded-md bg-base-200 shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden"
        >
          {({ close }) => (
            <InputButton
              className="btn btn-ghost"
              onInputChange={(file) => {
                handleImportingImages(file);
                close();
              }}
            >
              <div className="flex gap-4 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
                Photos
              </div>
            </InputButton>
          )}
        </Popover.Panel>
      </Popover>
    </>
  );
}

function SelectedMessagesActions() {
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const setModal = useStore((s) => s.setModal);

  const handleDeletingChat = () => {
    setModal({
      activeModal: "deleteMessageModal",
      state: selectedChats,
      open: true,
    });
  };

  const handleForwadingChat = () => {
    setModal({
      activeModal: "forwardMessageModal",
      state: selectedChats,
      open: true,
    });
  };

  return (
    <div className="flex justify-between items-center gap-4 w-full mx-auto p-4  ">
      <div className="flex items-center gap-2">
        <button className="btn btn-circle btn-sm btn-ghost" onClick={() => setSelectedChats(null)}>
          <XCircleIcon className="size-6" />
        </button>
        <label htmlFor="">{selectedChats.length} Selected</label>
      </div>
      <div className="flex items-center gap-2">
        <div className="btn btn-circle btn-sm btn-ghost" tabIndex={0} onClick={handleDeletingChat}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path
              fillRule="evenodd"
              d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="btn btn-circle btn-sm btn-ghost" tabIndex={0} onClick={handleDeletingChat}>
          <DocumentTextIcon className="size-5" />
        </div>
        <div className="btn btn-circle btn-sm btn-ghost" onClick={handleForwadingChat} tabIndex={0}>
          <ArrowUturnRightIcon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function BlockedUserNotification({ username }: { username: string }): React.ReactNode {
  return (
    <div className="flex justify-center items-center gap-4 w-full h-[64px] mx-auto p-4  ">
      <label className="text-sm text-center" htmlFor="">
        Can't send message to blocked user {username}
      </label>
    </div>
  );
}

function UnavailableConversation(): React.ReactNode {
  return (
    <div className="flex justify-center items-center gap-4 w-full h-[64px] mx-auto p-4  ">
      <label className="text-sm text-center" htmlFor="">
        You are not a member of this group
      </label>
    </div>
  );
}

export default memo(ChatInput);
