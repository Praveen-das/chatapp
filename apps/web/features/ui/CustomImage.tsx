import Image, { ImageProps } from "next/image";
import { SyntheticEvent } from "react";

export type ImagePropss = {
  href: string;
  placeHolder?: string;
} & Partial<ImageProps>;

export function CustomImage({ href, placeHolder, ...props }: ImagePropss) {
  function removePlaceholder(e: SyntheticEvent<HTMLImageElement>) {
    const elm = e.currentTarget;
    if (elm) elm.style.backgroundImage = "";
  }

  return (
    <Image
      {...props}
      className={`${props.className} bg-contain`}
      style={{ ...props.style, backgroundImage: `url(${placeHolder})` }}
      onLoad={removePlaceholder}
      alt={href}
      src={href} 
      />
  );
}
