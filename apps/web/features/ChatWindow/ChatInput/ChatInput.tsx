"use client";
import React, { ChangeEvent, memo, useState } from "react";

import { FaceSmileIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { ArrowUturnRightIcon, DocumentTextIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import useAuth from "@hooks/useAuth";
import useSelectedConversation from "@hooks/useSelectedConversation";
import { getParticipant } from "@lib/conversation";
import { generateMessageTemplate } from "@lib/messages";
import { getImages, parseUrl } from "@lib/utils";
import { IUrlAttachment } from "@repo/interfaces/messageInterface";
import ObjectID from "bson-objectid";
import { APP_NAME } from "config/constants";
import { AnimatePresence, motion } from "framer-motion";
import { Attachment, SendSolid } from "iconoir-react";
import useSocket from "../../../context/SocketProvider";
import { useAttachments } from "../../../store/attachments";
import { useConversationStore } from "../../../store/conversationStore";
import { useStore } from "../../../store/global";
import { useMessageStore } from "../../../store/messageStore";
import EmojiPicker from "../../ui/EmojiPicker";
import LinkPreview from "../../ui/LinkPreview";
import ImageAttachmentPreview from "./AttachmentPreview/ImageAttachmentPreview";
import UrlAttachmentPreview from "./AttachmentPreview/UrlAttachmentPreview";
import useUrlParser from "./useUrlParser";

function ChatInput() {
  const { user } = useAuth();
  const conversationId = useConversationStore((s) => s.selectedConversation)?.id!;
  const selectedConversation = useSelectedConversation(conversationId);

  const isBlockedConversation = selectedConversation?.host === "user" && selectedConversation.blocked;
  const isGroup = selectedConversation?.host === "group";
  const isSystemConversation = selectedConversation?.host === "system";
  const isMember = isGroup && selectedConversation?.members.some((m) => m.id === user?.id);

  const username = getParticipant(selectedConversation!)?.username;

  return (
    <div className="flex flex-col w-full mx-auto shadow-lg bg-[--base-200-300] sm:rounded-2xl">
      {isSystemConversation ? (
        <BlockedInput message={`You can not send messages to ${APP_NAME}`} />
      ) : isBlockedConversation ? (
        <BlockedInput message={`You can not send messages to blocked user ${username}`} />
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
  const { sendMessage } = useSocket();
  const { user } = useAuth();
  const setReplyRequest = useMessageStore((s) => s.setReplyRequest);
  const replyRequest = useMessageStore((s) => s.replyRequest);
  const selectedConversation = useConversationStore.getState().selectedConversation;
  const addImages = useAttachments((s) => s.addImages);

  if (selectedConversation?.host === "system") return;

  const [messageString, setMessageString] = useState("");
  const [loading, setLoading] = useState(false);

  const [toggleEmojiPicker, setToggleEmojiPicker] = useState(false);
  const [toggleAttachments, setToggleAttachments] = useState(false);
  const { metadata, setMetadata } = useUrlParser(messageString);

  const sender = selectedConversation?.members.find((m) => m.id === replyRequest?.userId);
  const receiver = sender?.id === user?.id ? "You" : sender?.username!;
  const replyMessage = replyRequest?.message || "";

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

  const handleMessaging = async () => {
    if (!messageString) return;
    if (loading) return;

    setLoading(true);

    const selectedConversation = useConversationStore.getState().selectedConversation;
    const conversations = useConversationStore.getState().conversations;
    const selectedUser = useStore.getState().selectedUser;
    const setSelectedUser = useStore.getState().setSelectedUser;

    let conversation = conversations.find(
      (c) =>
        c.id === selectedConversation?.id ||
        (c.host !== "system" && c.members.find((m) => m.id === selectedUser?.id! && c.host === "user"))
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

    const message = await generateMessageTemplate(conversation!, messageString, attachment);

    sendMessage({
      conversation: conversation!,
      messages: [message],
      callback: () => setLoading(false),
    });

    setSelectedUser(null);
    setMessageString("");
    setReplyRequest(null);
    setMetadata(null);
    setToggleEmojiPicker(false);
  };

  const motionProps = {
    initial: { height: "0px" },
    exit: { height: "0px" },
    animate: { height: "auto" },
  };

  function handleToggle(key: string) {
    setToggleEmojiPicker((s) => (s ? false : key === "emoji"));
    setToggleAttachments((s) => (s ? false : key === "attachment"));
  }

  async function handleImportingImages(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const payload = await getImages(files);
    if (payload) addImages(payload);
  }

  return (
    <div>
      <AnimatePresence>
        {replyRequest && (
          <motion.div {...motionProps} className="w-full overflow-hidden" key="replyRequest">
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
          </motion.div>
        )}

        {metadata && (
          <motion.div {...motionProps} className="w-full overflow-hidden" key="metadata">
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
          </motion.div>
        )}

        {toggleEmojiPicker && (
          <motion.div {...motionProps} className="w-full overflow-hidden" key="EmojiPicker" layout>
            <EmojiPicker open={toggleEmojiPicker} onEmojiSelect={handleEmoji} />
          </motion.div>
        )}

        {toggleAttachments && (
          <motion.div {...motionProps} className="w-full overflow-hidden" key="Attachments" layout>
            <div className="w-full flex gap-4 p-2 pb-0 text-sm">
              <label className="flex justify-center items-center gap-2 border-b-2 border-base-300 hover:border-primary px-4 py-4 cursor-pointer">
                <input
                  id="asdasdasd"
                  onChange={handleImportingImages}
                  type="file"
                  multiple
                  hidden
                  accept="image/png, image/gif, image/jpeg"
                />
                <PhotoIcon className="size-5" />
                Photos
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1 w-full mx-auto p-4">
        {/* <AttachmentPicker /> */}

        <div onClick={() => handleToggle("attachment")} className="btn btn-circle btn-ghost btn-sm">
          <Attachment width={20} height={20} />
        </div>
        <div onClick={() => handleToggle("emoji")} className="btn btn-circle btn-ghost btn-sm">
          <FaceSmileIcon className="size-6" />
        </div>

        <textarea
          rows={1}
          value={messageString}
          onChange={handleInput}
          className="w-full bg-transparent outline-none border-none ml-3 overflow-hidden resize-none"
        />
        <div className="btn btn-circle btn-sm btn-ghost" onClick={() => !loading && handleMessaging()} tabIndex={0}>
          <SendSolid className="size-6" />
        </div>
      </div>
    </div>
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

function BlockedInput({ message }: { message: string }): React.ReactNode {
  return (
    <div className="flex justify-center items-center gap-4 w-full h-[64px] mx-auto p-4  ">
      <label className="text-sm text-center" htmlFor="">
        {message}
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
