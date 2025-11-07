import { ChangeEvent, MouseEvent, useState } from "react";
import EmojiPicker from "../../ui/EmojiPicker";
import { useAttachments } from "../../../store/attachments";
import Image from "next/image";
import { useMessageStore } from "../../../store/messageStore";
import { getImages } from "@lib/utils";
import useSocket from "../../../context/SocketProvider";
import { useConversationStore } from "../../../store/conversationStore";
import { IImageAttachment, IImagePayload, IMessage } from "@repo/interfaces/messageInterface";
import ObjectID from "bson-objectid";
import { uploadImage } from "@lib/imageKit";
import { useStore } from "../../../store/global";
import { flip, shift, useFloating } from "@floating-ui/react";
import { generateMessageTemplate } from "@lib/messages";
import { getMemberById } from "@lib/conversation";

function ImageSelector() {
  const { sendMessage } = useSocket();
  const images = useAttachments((s) => s.images);
  const clearImages = useAttachments((s) => s.clearImages);
  const setMessageStore = useMessageStore((s) => s.setMessageStore);
  const setUploadProgress = useStore((s) => s.setUploadProgress);
  const setSelectedUser = useStore((s) => s.setSelectedUser);

  const [captions, setCaptions] = useState(Array(images.length).fill(""));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSendingAttachment = async () => {
    if (loading) return;

    setLoading(true);
    const selectedUser = useStore.getState().selectedUser;
    const {
      selectedConversation,
      conversations,
      conversationActions: { setSelectedConversation },
    } = useConversationStore.getState();

    let conversation =
      selectedConversation || conversations.find((c) => getMemberById(c, selectedUser?.id!) && c.host === "user");

    const conversationId = conversation?.id!;

    const messages = await Promise.all(
      images.map(async (image, i) => {
        let caption = captions[i];

        let attachment: IImageAttachment = {
          id: new ObjectID().toHexString(),
          type: "images",
          status: "uploading",
          ...image,
        };

        const message = await generateMessageTemplate(conversation!, caption, attachment);
        message.type = "placeholder";
        return message;
      })
    );

    clearImages();
    setCaptions([]);

    setSelectedConversation(conversationId);
    setMessageStore(conversationId, messages);

    const uploadImageAttachment = async (message: IMessage) => {
      const attachment = message.attachment;
      if (attachment?.type === "images" && attachment.status === "uploading") {
        const handleUploadProgress = (progress: number) => {
          setUploadProgress(attachment.fileId!, progress);
        };

        try {
          const res = await uploadImage(attachment.file!, attachment.file?.name!, false, handleUploadProgress);

          URL.revokeObjectURL(attachment.url);
          attachment.status = "success";
          attachment.file = undefined;
          // attachment.sender = message.from;

          if (message.attachment?.type === "images") message.attachment = { ...message.attachment, ...res };
        } catch (err) {
          setLoading(false);
          console.error("Image upload failed", err);
        }
      }
    };

    const uploadPromises = messages.map(uploadImageAttachment);
    await Promise.allSettled(uploadPromises);

    sendMessage({
      conversation: conversation!,
      messages,
      replacePlaceholder: true,
      callback: () => setLoading(false),
    });

    setSelectedUser(null);
  };

  return (
    <div className="flex flex-col gap-6 items-center h-full bg-[--base-200-300] px-4 mt-4 sm:rounded-2xl overflow-hidden">
      <ImagePreview src={images[selectedIndex]?.url!} />
      <Input
        {...{
          index: selectedIndex,
          captions,
          setCaptions,
        }}
      />
      <div
        className="grid gap-2 items-center w-full px-4 max-sm:my-6 my-10"
        style={{ gridTemplateColumns: "1fr min-content" }}
      >
        <SelectedImages
          {...{
            images,
            captions,
            setCaptions,
            selectedIndex,
            setSelectedIndex,
          }}
        />
        <div className="flex justify-center items-center h-full ml-4">
          <button
            className="btn btn-circle btn-md btn-primary text-[--black-white] justify-self-end"
            onClick={handleSendingAttachment}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectedImages({
  images,
  captions,
  setCaptions,
  selectedIndex,
  setSelectedIndex,
}: {
  images: IImagePayload[];
  captions: any;
  setCaptions: any;
  selectedIndex: number;
  setSelectedIndex: (idx: number) => void;
}) {
  const addImages = useAttachments((s) => s.addImages);
  const removeImages = useAttachments((s) => s.removeImages);

  const handleAddingImages = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const payload = await getImages(files);
    if (payload) addImages(payload);

    captions.push("");
    setSelectedIndex(0);
    setCaptions(captions);
  };

  const removeImage = (index: number, e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();

    captions.splice(index, 1);
    if (captions.length === 1) setSelectedIndex(0);
    setCaptions(captions.slice());
    removeImages(index);
  };

  return (
    <div className="grid justify-center gap-2 items-center h-20" style={{ gridTemplateColumns: "auto min-content" }}>
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
            <Image width={50} height={50} className="h-16 min-w-16 object-cover rounded-md" src={image.url} alt="" />
            <span className="group-hover:opacity-50 absolute inset-0 bg-black rounded-md opacity-0 duration-300 z-10"></span>
          </div>
        ))}
      </div>
      <label className="btn btn-square btn-outline flex items-center justify-center size-16 border-2 rounded-md cursor-pointer mr-auto">
        <input onChange={handleAddingImages} type="file" multiple hidden accept="image/png, image/gif, image/jpeg" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </label>
    </div>
  );
}

function Input({ index, captions, setCaptions }: { index: number; captions: any; setCaptions: any }) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    middleware: [flip(), shift()],
    placement: "top-start",
  });

  const handleMessageInput = (e: ChangeEvent<HTMLInputElement>) => {
    captions[index] = e.target.value;
    setCaptions([...captions]);
  };

  const handleEmoji = (emoji: any) => {
    captions[index] = captions[index].concat(emoji.native);
    setCaptions([...captions]);
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
      <div className="flex items-center px-2 gap-1 w-full max-w-sm h-[40px] rounded-md bg-[--base-300-400]">
        <div ref={refs.setReference} onClick={() => setOpen((s) => !s)} className="btn btn-circle btn-ghost btn-sm">
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
          value={captions[index]}
          onChange={handleMessageInput}
          className="w-full h-full bg-transparent outline-none border-none ml-2"
          type="text"
        />
      </div>
    </>
  );
}

function ImagePreview({ src }: { src: string }) {
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <Image width={500} height={500} className="w-full h-full object-contain" src={src} alt="" />
    </div>
  );
}

export default ImageSelector;
