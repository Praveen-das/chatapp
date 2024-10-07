import React, { ChangeEvent, MouseEvent, useState } from "react";
import EmojiPicker from "../ChatInput/EmojiPicker";
import { useAttachments } from "../../../../store/attachments";
import InputButton from "../../../ui/InputButton";
import Image from "next/image";
import { useMessageStore } from "../../../../store/messageStore";
import { getImages } from "@lib/utils";
import useMessage from "../../../../hooks/useMessage";
import useSocket from "../../../../context/SocketProvider";
import { useConversationStore } from "../../../../store/conversationStore";
import { IImageAttachment } from "../../../../interfaces/messageInterface";
import ObjectID from "bson-objectid";
import { uploadImage } from "@lib/imageKit";
import { useStore } from "../../../../store/global";
import useAuth from "@hooks/useAuth";
import { generateConversation } from "@lib/conversation";
import { flip, shift, useFloating } from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import motionconfig from "../../../../config/config";

function ImageSelector() {
  const { user } = useAuth();
  const images = useAttachments((s) => s.images);
  const addImages = useAttachments((s) => s.addImages);
  const removeImages = useAttachments((s) => s.removeImages);
  const clearImages = useAttachments((s) => s.clearImages);
  const addToMediaStore = useAttachments((s) => s.addToMediaStore);

  const setMessageStore = useMessageStore((s) => s.setMessageStore);
  const setRecentMessage = useMessageStore((s) => s.setRecentMessage);
  const updateMessages = useMessageStore((s) => s.updateUserMessages);

  const { generateMessageTemplate } = useMessage();
  const { sendMessage } = useSocket();
  const setUploadProgress = useStore((s) => s.setUploadProgress);

  const [open, setOpen] = useState(false);
  const [captions, setCaptions] = useState(Array(images.length).fill(""));
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { refs, floatingStyles } = useFloating({
    middleware: [flip(), shift()],
    placement: "top-start",
  });

  const handleAddingImages = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const payload = await getImages(files);
    if (payload) addImages(payload);

    captions.push("");
    setSelectedIndex(0);
    setCaptions(captions);
  };

  const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) => {
    captions[selectedIndex] = e.target.value;
    setCaptions([...captions]);
  };

  const handleEmoji = (emoji: any) => {
    captions[selectedIndex] = captions[selectedIndex].concat(emoji.native);
    setCaptions([...captions]);
  };

  const handleSendingAttachment = async () => {
    const selectedUser = useStore.getState().selectedUser;
    const {
      selectedConversation,
      conversations,
      setConversation,
      setSelectedConversation,
    } = useConversationStore.getState();

    let conversation =
      selectedConversation ||
      conversations.find(
        (c) =>
          c.members.find((m) => m.id === selectedUser?.id!) && c.host === "user"
      ) ||
      generateConversation(user!, selectedUser!);

    const conversationId = conversation?.id!;
    const userMedia: IImageAttachment[] = [];

    const payload = images.map((image, i) => {
      let caption = captions[i];

      let attachment: IImageAttachment = {
        id: new ObjectID().toHexString(),
        type: "images",
        status: "uploading",
        ...image,
      };

      const message = generateMessageTemplate(
        conversation!,
        caption,
        attachment
      );

      return message;
    });

    clearImages();
    setCaptions([]);

    setConversation(conversation);
    setSelectedConversation(conversationId);
    setMessageStore(conversationId, payload);

    const promises = payload.map((message) => {
      let attachment = message.attachment;
      if (attachment?.type === "images" && attachment.status === "uploading") {
        const handleUploadProgress = (progress: number) => {
          setUploadProgress(attachment.fileId!, progress);
        };

        return uploadImage(attachment.file!, attachment.file?.name!,false, handleUploadProgress)
          .then((res) => {
            if (attachment) {
              URL.revokeObjectURL(attachment.url);
              attachment.status = "success";
              attachment.file = undefined;
              attachment.sender = message.from;

              if (message.attachment?.type === "images") {
                message.attachment = { ...message.attachment, ...res };
                userMedia.push(message.attachment);
              }

              updateMessages(conversationId, [message]);
            }
          })
          .catch((err) => console.log(err));
      }
    });

    await Promise.all(promises);

    const recentMessage = payload.at(-1);
    conversation.recentMessage = recentMessage;

    setRecentMessage(conversationId, recentMessage || null);
    addToMediaStore(conversationId, "images", userMedia);
    sendMessage(payload, conversation!);
  };

  const removeImage = (index: number, e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    captions.splice(index, 1);
    if (captions.length === 1) setSelectedIndex(0);
    setCaptions(captions.slice());
    removeImages(index);
  };

  return (
    <>
      {open && (
        <>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles }}
            className="z-50 fixed w-[400px] bg-base-200 rounded-xl -mt-2"
          >
            <EmojiPicker open={open} onEmojiSelect={handleEmoji} />
          </div>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-20 " />
        </>
      )}
      <div className="flex flex-col gap-6 items-center h-full bg-gradient-to-t from-base-200 px-4 rounded-2xl overflow-hidden">
        <div className="flex flex-col w-full h-full overflow-hidden">
          <Image
            width={500}
            height={500}
            className="w-full h-full object-contain"
            src={images[selectedIndex]?.url!}
            alt=""
          />
        </div>
        <div className="flex items-center px-2 gap-1 w-full max-w-sm h-[40px] rounded-md bg-base-200">
          <div
            ref={refs.setReference}
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
          <input
            value={captions[selectedIndex]}
            onChange={handleMessageInput}
            className="w-full h-full bg-transparent outline-none border-none ml-2"
            type="text"
          />
        </div>
        <div
          className="grid gap-2 items-center w-full px-4 my-10 "
          style={{ gridTemplateColumns: "1fr min-content" }}
        >
          <div
            className="grid justify-center gap-2 items-center h-20"
            style={{ gridTemplateColumns: "auto min-content" }}
          >
            <div className="flex h-full items-center space-x-2 overflow-scroll no-scrollbar p-1">
              {images.map((image, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={`${selectedIndex === i ? "ring-[3px] ring-primary" : ""} group relative cursor-pointer rounded-md`}
                >
                  <div
                    onClick={(e) => removeImage(i, e)}
                    className="group-hover:opacity-100 btn btn-circle btn-xs btn-ghost absolute top-[2px] right-[2px] z-20 opacity-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </div>
                  <Image
                    width={50}
                    height={50}
                    className="h-16 min-w-16 object-cover rounded-md"
                    src={image.url}
                    alt=""
                  />
                  <span className="group-hover:opacity-50 absolute inset-0 bg-black rounded-md opacity-0 duration-300 z-10"></span>
                </div>
              ))}
            </div>
            <InputButton
              className="btn btn-square btn-outline flex items-center justify-center size-16 border-2 rounded-md cursor-pointer mr-auto"
              onInputChange={handleAddingImages}
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </InputButton>
          </div>
          <div className="flex justify-center items-center h-full ml-4">
            <button
              className="btn btn-circle btn-md btn-primary  justify-self-end"
              onClick={handleSendingAttachment}
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
      </div>
    </>
  );
}

export default ImageSelector;
