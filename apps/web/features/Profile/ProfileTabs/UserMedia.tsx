"use client";

import { useState } from "react";
import { useAttachments } from "../../../store/attachments";
import { useStore } from "../../../store/global";
import LinkPreview from "../../ui/LinkPreview";
import { IImageAttachment, IUrlAttachment } from "@repo/interfaces/messageInterface";
import useSelectedConversation from "@hooks/useSelectedConversation";
import { CustomImage } from "@features/ui/CustomImage";

function UserMedia() {
  const conversation = useSelectedConversation();

  if (!conversation) return;

  const mediaStore = useAttachments((s) => s.mediaStore);
  const profileTab = useStore((s) => s.profileTab);

  const media = mediaStore.get(conversation.id) || {};
  const mediaList = Object.keys(media).sort((a: string, b: string) => a.localeCompare(b));
  const [tab, setTab] = useState(mediaList[0]);
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="min-h-16 w-full flex items-center gap-4 px-4">
        <button onClick={() => profileTab.back()} className={`btn btn-sm btn-ghost btn-circle`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
        <label htmlFor="contact info">Media</label>
      </div>
      <div role="tablist" className="tabs tabs-bordered">
        {media &&
          mediaList.map((k) => {
            let key = k as keyof typeof media;
            let haveMedia = !!media[key]!.length;
            if (!haveMedia) return;
            return (
              <a
                key={key}
                onClick={() => setTab(key)}
                role="tab"
                className={`tab ${tab === key ? "tab-active" : ""} capitalize`}
              >
                {key}
              </a>
            );
          })}
      </div>
      <div className="w-full h-full bg-linear-to-t from-base-200">
        {tab === "images" && <ImagePreviews media={media[tab]!} />}
        {tab === "link" && <Links links={media[tab]!} />}
      </div>
    </div>
  );
}

function Links({ links }: { links: IUrlAttachment[] }) {
  return (
    <div className="grid gap-2 w-full overflow-y-scroll no-scrollbar p-2">
      {links.map((link) => {
        return link.metadata ? (
          <LinkPreview key={link.id} metadata={link.metadata} link={link.url} />
        ) : (
          link.url && (
            <div key={link.id} className="bg-base-300 rounded-2xl p-2">
              {link.url}
            </div>
          )
        );
      })}
    </div>
  );
}

function ImagePreviews({ media }: { media: IImageAttachment[] }) {
  const handleClick = (image: IImageAttachment) => {
    useStore.getState().setModal({ activeModal: "imageViewer", state: image, open: true });
  };

  return (
    <div className="grid grid-cols-4 gap-1 w-full overflow-y-scroll no-scrollbar">
      {media.map((image) => (
        <CustomImage
          key={image.id}
          onClick={() => handleClick(image)}
          width={100}
          height={100}
          href={image.url}
          placeHolder={image.url + "?tr=w-5"}
          className="w-full aspect-square object-cover cursor-pointer"
          alt={image.name}
        />
      ))}
    </div>
  );
}

export default UserMedia;
