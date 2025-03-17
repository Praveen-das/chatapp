import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../../store/global";
import { useAttachments } from "../../../store/attachments";
import { renderToString } from "react-dom/server";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import { SwiperOptions } from "swiper/types";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useConversationStore } from "../../../store/conversationStore";
import { downloadFromUrl } from "@lib/utils";
import { IImageAttachment } from "../../../interfaces/messageInterface";
import Image from "next/image";
import { IModal } from "@interfaces/modalInterface";
import Avatar from "../Avatar";

function ImageViewer() {
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const mediaStore = useAttachments((s) => s.mediaStore);
  const setModal = useStore((s) => s.setModal);
  const modal = useStore<IModal<IImageAttachment> | null>((s) => s.modal);
  const selectedAttachment = modal?.state;

  const [activeIndex, setActiveIndex] = useState(0);
  const paginationRef = useRef<HTMLDivElement>(null);

  const userImages = mediaStore.get(selectedConversation?.id!)?.images || [];
  let initialSlideIdx = 0;

  useMemo(() => {
    userImages.forEach((img, i) => {
      if (img.id === selectedAttachment?.id) initialSlideIdx = i;
    });
  }, [mediaStore, selectedAttachment, selectedConversation]);

  useEffect(() => {
    document.querySelector(".swiper-pagination-bullet-active")?.scrollIntoView({ inline: "center" });
  }, [selectedAttachment]);

  const pagination: SwiperOptions["pagination"] = useMemo(() => {
    return {
      el: ".swiper-pagination",
      clickable: true,
      renderBullet: function (index: number, className: string) {
        let image = userImages[index]!;
        let imageUrl = image?.url + "?tr=w-80,h-80"!;
        return renderToString(
          image && (
            <div className={`${className} btn btn-square btn-ghost`}>
              <Image width={80} height={80} className="w-full h-full object-cover" src={imageUrl} alt={image.name} />
            </div>
          )
        );
      },
    };
  }, [userImages]);

  const handleClose = () => {
    setModal(null);
  };

  const handleDownload = () => {
    const url = userImages[activeIndex]?.url;
    url && downloadFromUrl(url);
  };

  const senderId = userImages[activeIndex]?.sender
  const sender = selectedConversation?.members.find(m=>m.id === senderId)

  return (
    <div className="fixed inset-0 flex flex-col gap-2 w-full max-w-full h-full max-h-full rounded-none bg-gradient-to-t to-base-300 from-base-200 overflow-hidden p-4 z-50">
      {/* Header----------------- */}
      <div
        // variants={item}
        className="flex justify-between gap-2"
      >
        <div className="flex items-center gap-4 ">
          <Avatar url={sender?.profilePicture} onlineIndication={false} profileHidden={!sender?.rules?.profilePicture.isVisible} size="48px" />
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="username">
              {sender?.username}
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div onClick={handleDownload} className="btn btn-circle btn-ghost ml-auto">
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
          <div onClick={handleClose} className="btn btn-circle btn-ghost ml-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Image viewer----------------- */}
      <Swiper
        initialSlide={initialSlideIdx}
        pagination={pagination}
        navigation={{ nextEl: ".nextEl", prevEl: ".prevEl" }}
        modules={[Pagination, Navigation]}
        onSlideChange={(e) => setActiveIndex(e.activeIndex)}
        className="w-full h-full my-2"
        dir="rtl"
      >
        {userImages.map(({ url, name }, i) => (
          <SwiperSlide key={i}>
            <Image width={500} height={500} className="block w-full h-full object-contain" src={url} alt={name} />
          </SwiperSlide>
        ))}

        <div className="nextEl absolute left-0 top-0 bottom-0 my-auto btn btn-circle btn-ghost z-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-8">
            <path
              fillRule="evenodd"
              d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className=" prevEl absolute right-0 top-0 bottom-0 my-auto btn btn-circle btn-ghost z-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-8">
            <path
              fillRule="evenodd"
              d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </Swiper>

      {/* Pagination----------------- */}
      {userImages.length > 1 && (
        <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-black to-transparent opacity-25 my-4"></div>
      )}
      <div
        ref={paginationRef}
        className="swiper-pagination flex justify-center flex-row-reverse overflow-scroll no-scrollbar mt-4"
      ></div>
    </div>
  );
}

export default ImageViewer;
