import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../../../store/global";
import { useAttachments } from "../../../../store/attachments";
import { renderToString } from "react-dom/server";
import { AnimatePresence, motion } from "framer-motion";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import { SwiperOptions } from "swiper/types";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useConversationStore } from "../../../../store/conversationStore";
import { downloadFromUrl } from "@lib/utils";
import {
  IImageAttachment,
  IUserMedia,
} from "../../../../interfaces/messageInterface";
import Image from "next/image";

function ImageViewer() {
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );
  const mediaStore = useAttachments((s) => s.mediaStore);
  const setModal = useStore((s) => s.setModal);
  const modal = useStore<IModal<IImageAttachment> | null>((s) => s.modal);
  const selectedAttachment = modal?.state;

  const [userMedia, setUserMedia] = useState<IUserMedia>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const paginationRef = useRef<HTMLDivElement>(null);

  const userImages = userMedia["images"] || [];

  const getInitialSlideIdx = useCallback(() => {
    let index = 0;
    userImages.forEach(({ id }, i) => {
      if (id === selectedAttachment?.id) return (index = i);
    });
    return index;
  }, [selectedAttachment, userImages]);

  const INITIAL_SLIDE = getInitialSlideIdx();

  useEffect(() => {
    const _userMedia = mediaStore.get(selectedConversation?.id!) || {};
    setUserMedia(_userMedia);
  }, [selectedConversation, mediaStore]);

  useEffect(() => {
    document
      .querySelector(".swiper-pagination-bullet-active")
      ?.scrollIntoView({ inline: "center" });
  }, [selectedAttachment]);

  const pagination: SwiperOptions["pagination"] = useMemo(() => {
    return {
      el: ".swiper-pagination",
      clickable: true,
      renderBullet: function (index: number, className: string) {
        let attachment = userImages[index]!;
        let imageUrl = attachment?.url + "?tr=w-80,h-80"!;
        return renderToString(
          attachment && (
            <div className={`${className} btn btn-square btn-ghost`}>
              <Image
                width={80}
                height={80}
                className="w-full h-full object-cover"
                src={imageUrl}
                alt={attachment.name}
              />
            </div>
          )
        );
      },
    };
  }, [userImages]);

  const handleClose = () => {
    setModal(null);
    document?.querySelector<HTMLDialogElement>("#action-modal")?.close();
  };

  const handleDownload = () => {
    const url = userImages[activeIndex]?.url;
    url && downloadFromUrl(url);
  };

  const container = {
    hidden: { opacity: 0, translateY: "-5px" },
    visible: {
      opacity: 1,
      translateY: "0px",
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, translateY: "-5px" },
    visible: { opacity: 1, translateY: "0px" },
  };

  return (
    // <AnimatePresence>
    //   {selectedAttachment && (
    //   )}
    // </AnimatePresence>
    <motion.div
      // variants={container}
      // initial="hidden"
      // animate="visible"
      // exit="hidden"
      className="fixed inset-0 flex flex-col gap-2 w-full max-w-full h-full max-h-full rounded-none bg-base-200 overflow-hidden p-4 z-50"
    >
      {/* Header----------------- */}
      <motion.div
        // variants={item}
        className="flex justify-between gap-2"
      >
        <div className="flex items-center gap-4  px-4">
          <div className="size-12 bg-gray-700 rounded-full"></div>
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="username">
              {userImages[activeIndex]?.sender}
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            onClick={handleDownload}
            className="btn btn-circle btn-ghost ml-auto"
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
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </div>
          <div
            onClick={handleClose}
            className="btn btn-circle btn-ghost ml-auto"
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Image viewer----------------- */}
      <Swiper
        initialSlide={INITIAL_SLIDE}
        pagination={pagination}
        navigation={{ nextEl: ".nextEl", prevEl: ".prevEl" }}
        modules={[Pagination, Navigation]}
        onSlideChange={(e) => setActiveIndex(e.activeIndex)}
        className="w-full h-full my-2"
        dir="rtl"
      >
        {userImages.map(({ url, name }, i) => (
          <SwiperSlide key={i}>
            <Image
              width={500}
              height={500}
              className="block w-full h-full object-contain"
              src={url}
              alt={name}
            />
          </SwiperSlide>
        ))}

        <div className="nextEl absolute left-0 top-0 bottom-0 my-auto btn btn-circle btn-ghost z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-8"
          >
            <path
              fillRule="evenodd"
              d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className=" prevEl absolute right-0 top-0 bottom-0 my-auto btn btn-circle btn-ghost z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-8"
          >
            <path
              fillRule="evenodd"
              d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </Swiper>
      
      {/* Pagination----------------- */}
      {userImages.length > 1 && <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-black to-transparent opacity-25 my-4"></div> }
      <div
        ref={paginationRef}
        className="swiper-pagination flex justify-center flex-row-reverse overflow-scroll no-scrollbar mt-4"
      ></div>
    </motion.div>
  );
}

export default ImageViewer;
