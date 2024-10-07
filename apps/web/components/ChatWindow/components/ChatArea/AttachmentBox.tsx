'use client'
import { ReactNode } from "react";
import {
  IAttachment,
  IImageAttachment,
  IUrlAttachment,
} from "../../../../interfaces/messageInterface";
import ImageAttachment from "./ImageAttachment";
import UrlAttachment from "./UrlAttachment";

interface IAttachmentBox {
  attachment: IAttachment
}

const AttachmentBox = ({ attachment }: IAttachmentBox) => {
  const renderAttachment = {
    images: <ImageAttachment attachment={attachment as IImageAttachment} />,
    link: <UrlAttachment attachment={attachment as IUrlAttachment} />,
  };

  return (
    <div className="">
      {renderAttachment[attachment.type as keyof typeof renderAttachment]}
    </div>
  );
};

export default AttachmentBox
