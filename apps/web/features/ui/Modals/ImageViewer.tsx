import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../../store/global";
import { useAttachments } from "../../../store/attachments";
import { renderToString } from "react-dom/server";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Thumbs } from "swiper/modules";
import { SwiperOptions } from "swiper/types";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useConversationStore } from "../../../store/conversationStore";
import { downloadFromUrl } from "@lib/utils";
import { IImageAttachment } from "@repo/interfaces/messageInterface";
import Image from "next/image";
import Avatar from "../Avatar";
import { IModal } from "@interfaces/modalInterface";
import { CustomImage } from "../CustomImage";
import { ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/solid";
import FramerWrapper from "../MotionWrapper";

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
    document
      .querySelector(".swiper-pagination-bullet-active")
      ?.scrollIntoView({ inline: "center", behavior: "smooth" });
  }, [activeIndex]);

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
    setModal(false);
  };

  const handleDownload = () => {
    const url = userImages[activeIndex]?.url;
    url && downloadFromUrl(url);
  };

  const senderId = userImages[activeIndex]?.sender;
  const sender = selectedConversation?.host !== "system" ? selectedConversation?.members.find((m) => m.id === senderId) : null;

  return (
    <FramerWrapper
      className={`fixed inset-0 flex flex-col gap-2 w-full max-w-full h-full max-h-full rounded-none overflow-hidden p-4 z-50 bg-[--modal]`}
    >
      {/* Header----------------- */}
      <div
        // variants={item}
        className="flex justify-between gap-2"
      >
        <div className="flex items-center gap-4 ">
          <Avatar
            url={sender?.profilePicture}
            onlineIndication={false}
            profileHidden={!sender?.rules?.profilePicture.isVisible}
          />
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="username">
              {sender?.username}
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div onClick={handleDownload} className="btn btn-circle btn-sm btn-ghost ml-auto">
              <ArrowDownTrayIcon className="size-5" />
            </div>
            <form method="dialog">
              <button className="btn btn-circle btn-sm btn-ghost ml-auto">
                <XMarkIcon className="size-5" />
              </button>
            </form>
        </div>
      </div>

      {/* Image viewer----------------- */}
      <Swiper
        initialSlide={initialSlideIdx}
        pagination={pagination}
        navigation={{ nextEl: ".nextEl", prevEl: ".prevEl" }}
        modules={[Pagination, Navigation, Thumbs]}
        onSlideChange={(e) => setActiveIndex(e.activeIndex)}
        className="w-full h-full my-2"
        dir="rtl"
      >
        {userImages.map(({ url, name, width, height }, i) => {
          const ASPECT_RATIO = width! / height!;

          return (
            <SwiperSlide key={i} className="">
              <div className="h-full w-full flex justify-center items-center">
                <div style={{ height: "100%", maxWidth: "100%", maxHeight: "fit-content", aspectRatio: ASPECT_RATIO }}>
                  <CustomImage
                    href={url}
                    placeHolder={url + "?tr=w-5"}
                    width={500}
                    height={500}
                    className="w-full h-full object-contain"
                    alt={name}
                  />
                </div>
              </div>
            </SwiperSlide>
          );
        })}

        <div className="nextEl absolute left-0 top-0 bottom-0 my-auto btn btn-circle btn-ghost z-10">
          <ChevronLeftIcon className="size-5" />
        </div>
        <div className=" prevEl absolute right-0 top-0 bottom-0 my-auto btn btn-circle btn-ghost z-10">
          <ChevronRightIcon className="size-5" />
        </div>
      </Swiper>

      {/* Pagination----------------- */}
      <div className="w-full flex justify-center">
        <div
          ref={paginationRef}
          className="swiper-pagination !w-auto flex flex-row-reverse overflow-scroll no-scrollbar mt-4"
        ></div>
      </div>
    </FramerWrapper>
  );
}

export default ImageViewer;
