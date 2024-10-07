import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { IUrlAttachment } from "../../../../interfaces/messageInterface";

const UrlAttachment = ({ attachment }: { attachment: IUrlAttachment }) => {
    const sameHost = attachment.host === window.location.host
    const metadata = attachment.metadata

    if (!metadata) return null
    return (
        <Link href={attachment.url} target={!sameHost ? '_blank' : ''}>
            <div className="w-full max-w-[300px] max-h-sm flex flex-col gap-1 justify-between bg-black/20 pointer-events-none rounded-xl">
                {metadata.image &&
                    <Image
                        width={500}
                        height={250}
                        className="rounded-t-xl w-full aspect-video"
                        src={metadata.image}
                        alt={metadata.image}
                        // placeholder="blur"
                        // blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQMAAADCCAMAAAB6zFdcAAAAS1BMVEX///+hoaGdnZ3ExMTx8fGlpaXNzc2enp7i4uL4+PjIyMj19fWampr5+fn8/PzT09Pr6+u9vb2zs7OsrKzc3NzW1tapqam4uLjh4eFxahFAAAADCUlEQVR4nO3bDW+qMBiG4VKpRSlFwM39/196QBER+ZiDxLw995UtSxw260MpbytTCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC51Uab+rw6R69zxfa2ihqvleztmkm+XSX3nZoOr9FAF0Qx0936W1p/Web7USRFpmBPmSH5utq+POtX2T+qGWOA+e3a25PBgFk4JX36wKRn8F6ojOoz398LMti5d1ddgYqd02No8tVhZ7oDNSXM9caR5drpgTRGaT3WtG4fEVzojPIXVftViuaE51B8Vgz6P/1Wrg8MnDZ35sTncFedxmYFc2JzuDkbNTeGOY7kaZq5loRnYHadQMhnTu+sK7IplMQnYH3F3fbTzrNneeiTkpX0weIzqB2Lo35Ps6OgtsdVO8mD5CegfKHdGaYq2bSaO8cP2riOOkZzJcFdQXtv+3SnCE9gwW+ngxMV0tOvCfwDOpV1WP3eOoGGngG8dMWuk5Gr52wM/DV86cQdrSiDjkDr3YuelaOzaIhZ6DOwwii0X2GkDOIhwk0U8Lp9biAMvBJv391aVCOfST5/VpRhZNBbJzr7a16ddQjEUS2CDeDzOjI6Oox8Scvk8HUlBBIBl5drmddF/eJPx1PoBkJwykhkAy67VV3bl+4jF4J1wyGNXMgGZy6Huv4+kI+GUF/sNyEkIFXWTU4y8nsUyr1YAktg/6e2m1l5M1sBrYdLK0gMniuB13S33QfD6FSvQ/nQsggHl77+4nbYm+w7FRIGfh6cWiee7j8yJrV58e8KD+Dp8ng98xjSpCfwc+fIohs2TUnPoPpenCB6/otPoPqz8+runvNLD2D8cXh75h2s114BvP14AJ7ud0bZGeQzteDS9pltOwMpheHv3PbWROdQb5YDy4xzTOuUjNonj86rY6g2VmTOw7qDA6Rc067FXT97lx0BvFPsgXB18KGzUnNwO63Uwr9fyajm2e1N1EvtQVmkJlten9nVz3u/CHJblv5hv8RIhYZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIH7B0uwLlAhgDlaAAAAAElFTkSuQmCC'
                    />}
                <div className="flex flex-col gap-1 px-4 py-2">
                    <label className="" htmlFor="title">{metadata.title}</label>
                    <p className="truncate font-extralight">{metadata.description}</p>
                    <p className="truncate pb-2 text-white/30">{attachment.host}</p>
                </div>
            </div>
        </Link>
    )
}

export default memo(UrlAttachment)