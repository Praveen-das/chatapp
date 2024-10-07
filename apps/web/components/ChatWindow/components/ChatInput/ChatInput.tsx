"use client";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { Popover } from "@headlessui/react";

import useSocket from "../../../../context/SocketProvider";
import { useMessageStore } from "../../../../store/messageStore";
import useAuth from "@hooks/useAuth";
import { useStore } from "../../../../store/global";
import ForwardIcon from "../../../../public/forward.svg";
import EmojiPicker from "./EmojiPicker";
import { parseUrl } from "@lib/utils";
import { useAttachments } from "../../../../store/attachments";
import InputButton from "../../../ui/InputButton";
import useMessage from "@hooks/useMessage";
import { useConversationStore } from "../../../../store/conversationStore";
import useSelectedConversation from "@hooks/useSelectedConversation";
import LinkPreview from "../../../ui/LinkPreview";
import { IUrlAttachment } from "@interfaces/messageInterface";
import ObjectID from "bson-objectid";
import { getUrlMetadata } from "@lib/fetchers";
import { generateConversation } from "@lib/conversation";
import { getImages } from "@lib/utils";

export function ChatInput() {
  const { user } = useAuth();
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );
  const selectedUser = useStore((s) => s.selectedUser);
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const { blockedUsers } = useSocket();

  const receiver =
    (selectedConversation?.host === "user" &&
      selectedConversation?.members.find((m) => m.id !== user?.id!)) ||
    selectedUser;
  const isBlockedUser = blockedUsers.some(
    (u) => u.blockedUser.id === receiver?.id
  );

  return (
    <div className="flex flex-col w-full mx-auto bg-base-200 shadow-lg rounded-2xl">
      {isBlockedUser ? (
        <BlockedUserNotification username={selectedConversation?.id!} />
      ) : !!selectedChats.length ? (
        <SelectedMessagesActions />
      ) : (
        <Input />
      )}
    </div>
  );
}

function SelectedMessagesActions() {
  const selectedChats = useMessageStore((s) => s.selectedChats);
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const setModal = useStore((s) => s.setModal);

  const handleDeletingChat = () => {
    setModal({ activeModal: "deleteMessageModal", state: selectedChats });
    (
      document?.getElementById("action-modal") as HTMLDialogElement
    )?.showModal();
  };

  const handleForwadingChat = () => {
    setModal({ activeModal: "forwardMessageModal", state: selectedChats });
    document?.querySelector<HTMLDialogElement>("#action-modal")?.showModal();
  };

  return (
    <div className="flex justify-between items-center gap-4 w-full h-[60px] mx-auto p-4  ">
      <div className="flex items-center gap-2">
        <button
          className="btn btn-circle btn-sm btn-ghost"
          onClick={() => setSelectedChats(null)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <label htmlFor="">{selectedChats.length} Selected</label>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="btn btn-circle btn-sm btn-ghost"
          onClick={handleDeletingChat}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5"
          >
            <path
              fillRule="evenodd"
              d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button
          className="btn btn-circle btn-sm btn-ghost"
          onClick={handleForwadingChat}
        >
          <ForwardIcon className="text-xl fill-white" />
        </button>
      </div>
    </div>
  );
}

function Input(): React.ReactNode {
  const setMessageStore = useMessageStore((s) => s.setMessageStore);
  const setReplyRequest = useMessageStore((s) => s.setReplyRequest);
  const clearUnreadMessages = useMessageStore((s) => s.clearUnreadMessages);
  const setRecentMessage = useMessageStore((s) => s.setRecentMessage);
  const conversations = useConversationStore((s) => s.conversations);
  const setConversation = useConversationStore((s) => s.setConversation);
  const selectedConversation = useSelectedConversation();
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const setSelectedUser = useStore((s) => s.setSelectedUser);
  const selectedUser = useStore((s) => s.selectedUser);
  const addToMediaStore = useAttachments((s) => s.addToMediaStore);

  const { sendMessage } = useSocket();
  const { user } = useAuth();
  const { generateMessageTemplate } = useMessage();

  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [metadata, setMetadata] = useState<IUrlMetadata | null>(null);

  const handleMessaging = () => {
    if (!message) return;

    let conversation =
      selectedConversation ||
      conversations.find(
        (c) =>
          c.members.find((m) => m.id === selectedUser?.id!) && c.host === "user"
      ) ||
      generateConversation(user!, selectedUser!);

    delete conversation.recentMessage;

    const conversationId = conversation?.id;
    const url = parseUrl(message);

    const urlAttachment: IUrlAttachment | null = url
      ? {
          metadata,
          type: "link",
          id: new ObjectID().toHexString(),
          url: message,
          host: url.host,
        }
      : null;

    const payload = generateMessageTemplate(
      conversation,
      message,
      urlAttachment
    );

    const attachment = payload.attachment;

    sendMessage([payload], conversation);

    delete conversation.unsaved;
    conversation.recentMessage = payload;

    if (conversation.host === "user" && conversation.deletedForUser)
      conversation.deletedForUser = false;

    setRecentMessage(conversationId, payload);
    setConversation(conversation);
    setMessageStore(conversationId, [payload]);

    attachment &&
      addToMediaStore(conversationId, attachment.type, [attachment]);

    clearUnreadMessages(selectedConversation?.id);
    setSelectedConversation(conversationId);

    setMetadata(null);
    setSelectedUser(null);
    setReplyRequest(null);
    setOpen(false);
  };

  const handleEmoji = (emoji: any) => {
    setMessage((s) => s.concat(emoji.native));
  };

  useEffect(() => {
    const isUrl = parseUrl(message);

    (async () => {
      if (isUrl) {
        try {
          const response = await getUrlMetadata(message);
          setMetadata({ ...response });
        } catch (error: any) {
          setMetadata(null);
        }
      }
    })();
  }, [message]);

  return (
    <div>
      {metadata && (
        <div className="flex items-center p-2">
          <LinkPreview metadata={metadata} link={message} />
          <div
            onClick={() => setMetadata(null)}
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
      <div className="flex items-center gap-1 w-full h-[60px] mx-auto p-4">
        <div
          onClick={() => setOpen((s) => !s)}
          className="btn btn-circle btn-ghost btn-sm"
        >
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
              d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
            />
          </svg>
        </div>
        <AttachmentPicker />
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full h-full bg-transparent outline-none border-none ml-3"
          type="text"
        />
        <button
          className="btn btn-circle btn-sm btn-ghost"
          onClick={handleMessaging}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
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

function BlockedUserNotification({
  username,
}: {
  username: string;
}): React.ReactNode {
  return (
    <div className="flex justify-center items-center gap-4 w-full h-[60px] mx-auto p-4  ">
      <label className="text-sm text-center" htmlFor="">
        Can't send message to blocked user {username}
      </label>
    </div>
  );
}
