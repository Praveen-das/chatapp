import Link from "next/link";

const UrlAttachment = ({ attachment }: { attachment: IUrlAttachment }) => {

    return (
        <Link href={attachment.url} target="_blank">
            <div className="w-full max-w-xs max-h-sm flex flex-col gap-1 justify-between bg-black/20 rounded-xl pointer-events-none">
                {attachment.image && <img className="rounded-xl" src={attachment.image} alt="" />}
                <label className="text-base px-2" htmlFor="title">{attachment.title}</label>
                <p className="mb-auto truncate px-2 pb-2">{attachment.description}</p>
                <p className="mb-auto truncate px-2 pb-2 text-white/30">{new URL(attachment.url).host}</p>
            </div>
        </Link>
    )
}

export default UrlAttachment