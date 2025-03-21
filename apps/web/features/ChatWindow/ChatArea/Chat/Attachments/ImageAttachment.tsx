import Image from "next/image";
import { useAttachments } from "../../../../../store/attachments";
import { IImageAttachment } from "../../../../../interfaces/messageInterface";
import { useStore } from "../../../../../store/global";
import {IKImage} from 'imagekitio-next'

declare module "csstype" {
  interface Properties {
    "--value"?: number;
    "--size"?: string;
    "--thickness"?: string;
  }
}

const ImageAttachment = ({ attachment,isPlaceholder }: { attachment: IImageAttachment;isPlaceholder:boolean }) => {
  if(attachment?.type !== "images") return null
  
  const setModal = useStore(s=>s.setModal);
  const uploadProgress =
    useStore((s) => s.uploadProgress).get(attachment.fileId!) || 0;
  const uploadingCompleted = uploadProgress === 100;
  const width = attachment.width!;
  const height = attachment.height!;

  const handleClick = () => {
    if (isPlaceholder) return;
    setModal({activeModal:'imageViewer',state:attachment,open:true})
  };

  const ASPECT_RATIO = width / height;

  return (
    <>
      <div
        onClick={handleClick}
        className="flex relative"
        style={{
          aspectRatio: ASPECT_RATIO,
          [ASPECT_RATIO > 1 ? "width" : "height"]: "300px",
        }}
      >
        {isPlaceholder && (
          <div
            className={`backdrop-blur-md bg-black/50 flex justify-center items-center duration-200 absolute inset-0 rounded-lg z-10`}
          >
            {uploadingCompleted ? (
              <span className="loading loading-spinner w-[50px]"></span>
            ) : (
              <div
                className="radial-progress"
                style={{
                  "--value": 100,
                  "--size": "3rem",
                  "--thickness": "6px",
                }}
                role="progressbar"
              >
                <span className="text-xs">{uploadProgress + "%"}</span>
              </div>
            )}
          </div>
        )}
        <Image
          fill
          sizes="(max-width: 500px) 100vw 180px"
          src={attachment.url!}
          className="rounded-2xl"
          alt={attachment.name!}
        />
      </div>
    </>
  );
};

export default ImageAttachment;
