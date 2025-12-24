"use client";
import React, { ChangeEvent, memo, useEffect, useState } from "react";

import { FaceSmileIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { ArrowUturnRightIcon, DocumentTextIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import useAuth from "@hooks/useAuth";
import useSelectedConversation from "@hooks/useSelectedConversation";
import { getReceiverMetadata, getUserById } from "@lib/conversation";
import { generateMessageTemplate } from "@lib/messages";
import { getImages, parseUrl } from "@lib/utils";
import { IUrlAttachment, IUrlMetadata } from "@repo/interfaces/messageInterface";
import ObjectID from "bson-objectid";
import { APP_NAME } from "config/constants";
import { AnimatePresence, motion } from "framer-motion";
import { Attachment, SendSolid, Sparks } from "iconoir-react";
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
//@ts-ignore
import { removePII } from "@coffeeandfun/remove-pii";
import { useCompletion } from "@ai-sdk/react";

import useMediaQuery from "@hooks/useMediaQuery";
import useAutosizeTextArea from "@hooks/useAutosizeTextArea";
import { useAiChat } from "context/AiChatProvider";
// import { Message } from "@lib/inngest/chat";

function ChatInput() {
  const { user } = useAuth();
  const selectedConversation = useSelectedConversation();

  const isBlockedConversation = selectedConversation?.host === "user" && selectedConversation.blocked;
  const isGroup = selectedConversation?.host === "group";
  const isSystemConversation = selectedConversation?.host === "system";
  const isMember = isGroup && selectedConversation?.members.some((m) => m.userId === user?.id);

  const username = getUserById(getReceiverMetadata(selectedConversation!)?.userId!)?.username;

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
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <>
      {isMobile ? (
        <div className="sm:hidden duration-300">
          <Input />
        </div>
      ) : (
        <div className="max-sm:hidden">{!!selectedChats.length ? <SelectedMessagesActions /> : <Input />}</div>
      )}
    </>
  );
}

const setSelectedUser = useStore.getState().setSelectedUser;
const setReplyRequest = useMessageStore.getState().setReplyRequest;

function Input(): React.ReactNode {
  const { user } = useAuth();
  const selectedConversation = useConversationStore((s) => s.selectedConversation);

  const replyRequest = useMessageStore((s) => s.replyRequest);
  const addImages = useAttachments((s) => s.addImages);

  const isAiConversation = selectedConversation?.host === "ai";
  const isSystemConversation = selectedConversation?.host === "system";

  const { completion, complete, setCompletion, isLoading } = useCompletion();

  if (isSystemConversation) return;

  const [messageString, setMessageString] = useState("");
  const [previousInput, setPreviousInput] = useState("");

  const [toggleEmojiPicker, setToggleEmojiPicker] = useState(false);
  const [toggleAttachments, setToggleAttachments] = useState(false);
  const { metadata, setMetadata } = useUrlParser(messageString);
  const textareaRef = useAutosizeTextArea(messageString, 200);

  const sender = getUserById(replyRequest?.userId!);
  const receiver = sender?.id === user?.id ? "You" : sender?.username!;
  const replyMessage = replyRequest?.message || "";

  const handleEmoji = (emoji: any) => {
    setMessageString((s) => s.concat(emoji.native));
  };

  function handleInput(e: ChangeEvent<HTMLTextAreaElement>) {
    setMessageString(e.target.value);
  }

  const handleAssist = async () => {
    if (!messageString) return;

    try {
      // Get messages from both stores and combine
      const conversationId = selectedConversation?.id!;
      const messageStore = useMessageStore.getState().messageStore.get(conversationId) || [];
      const messageHistory = useMessageStore.getState().messageHistory.get(conversationId) || [];
      const allMessages = [...messageHistory, ...messageStore];

      // Get last 5 messages and format for context
      const recentContext = allMessages
        .slice(-5)
        .filter((m) => !m.deleted && m.type === "message")
        .map((m) => ({
          from: m.from,
          message: removePII(m.message),
        }));

      complete(messageString, {
        body: { context: recentContext, enableContext: true, originalInput: previousInput },
      }).then((finalCompletion) => {
        if (finalCompletion) {
          if (!previousInput) setPreviousInput(messageString);
          setMessageString(finalCompletion);
          setCompletion("");
        }
      });
    } catch (error) {
      console.error("Failed to assist", error);
    }
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

  function handleReset() {
    setSelectedUser(null);
    setMessageString("");
    setReplyRequest(null);
    setMetadata(null);
    setToggleEmojiPicker(false);
    setPreviousInput("");
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
        {!isAiConversation && (
          <div onClick={() => handleToggle("attachment")} className="btn btn-circle btn-ghost btn-sm">
            <Attachment width={20} height={20} />
          </div>
        )}
        <div onClick={() => handleToggle("emoji")} className="btn btn-circle btn-ghost btn-sm">
          <FaceSmileIcon className="size-6" />
        </div>

        <textarea
          ref={textareaRef}
          rows={1}
          value={completion || messageString}
          onChange={handleInput}
          className="w-full bg-transparent outline-none border-none ml-3 overflow-hidden resize-none"
        />

        {messageString.trim().length > 3 && (
          <button
            className={`btn btn-circle btn-xs btn-ghost ${isLoading ? "loading" : ""}`}
            onClick={handleAssist}
            title="AI Assist"
          >
            <Sparks className="size-5" />
          </button>
        )}
        {isAiConversation ? (
          <AiInputButton messageString={messageString} onClick={handleReset} isLoading={isLoading} />
        ) : (
          <InputButton messageString={messageString} metadata={metadata} onClick={handleReset} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}

function InputButton({
  isLoading,
  messageString,
  metadata,
  onClick,
}: {
  isLoading: boolean;
  messageString: string;
  metadata: IUrlMetadata | null | undefined;
  onClick: () => void;
}) {
  const { sendMessage } = useSocket();
  const selectedConversation = useConversationStore((s) => s.selectedConversation);

  const handleMessaging = async () => {
    try {
      if (!messageString) return;
      if (isLoading) return;

      const selectedUser = useStore.getState().selectedUser;

      const conversations = useConversationStore.getState().conversations;
      let conversation = conversations.find(
        (c) =>
          c.id === selectedConversation?.id ||
          (c.host === "user" && c.members.find((m) => m.userId === selectedUser?.id!))
      );

      if (!conversation) return;

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

      onClick();

      await sendMessage({ conversation: conversation!, messages: [message] });
    } catch (error) {
      console.log(error);
    }
  };

  return <Button isLoading={isLoading} onClick={handleMessaging} />;
}

function AiInputButton({
  isLoading,
  messageString,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
  messageString: string;
}) {
  const { user } = useAuth();
  const { sendMessage, status } = useAiChat();

  const handleMessagingToAi = async () => {
    try {
      if (!messageString) return;

      const selectedConversation = useConversationStore.getState().selectedConversation;

      const metadata = generateMessageTemplate(selectedConversation!, messageString);

      onClick();

      await sendMessage({
        text: messageString,
        metadata: { ...metadata, from: user?.id, to: "ai" },
      });
    } catch (error) {
      console.log(error);
    }
  };

  return <Button isLoading={isLoading || status === "streaming"} onClick={handleMessagingToAi} />;
}

function Button({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) {
  return (
    <button disabled={isLoading} className="btn btn-circle btn-sm btn-ghost" onClick={() => onClick()} tabIndex={0}>
      <SendSolid className="size-6" />
    </button>
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

export default ChatInput;
