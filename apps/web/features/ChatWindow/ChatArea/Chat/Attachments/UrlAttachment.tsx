import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { IUrlAttachment } from "@repo/interfaces/messageInterface";

const UrlAttachment = ({ attachment }: { attachment: IUrlAttachment }) => {
  if(attachment?.type !== 'link') return null
  const sameHost = attachment.host === window.location.host;
  
  if (!attachment.metadata) return null;
  return (
    <Link href={attachment.url} target={!sameHost ? "_blank" : ""}>
      <div className="w-full max-w-[300px] max-h-sm flex flex-col gap-1 justify-between bg-black/20 pointer-events-none">
        {attachment.metadata?.image && (
          <Image
            width={500}
            height={250}
            className="rounded-t-xl w-full aspect-video"
            src={attachment.metadata.image}
            alt={attachment.metadata.image}
          />
        )}
        <div className="flex flex-col gap-1 px-4 py-2">
          <label className="" htmlFor="title">
            {attachment.metadata?.title}
          </label>
          <p className="truncate font-extralight">
            {attachment.metadata?.description}
          </p>
          <p className="truncate pb-2 opacity-50">
            {attachment.host}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default memo(UrlAttachment);
