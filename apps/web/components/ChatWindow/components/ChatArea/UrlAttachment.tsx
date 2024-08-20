import Link from "next/link";

const UrlAttachment = ({ attachment }: { attachment: IUrlAttachment }) => {
    const sameHost = attachment.host === window.location.host
    const metadata = attachment.metadata

    if (!metadata) return null
    return (
        <Link href={attachment.url} target={!sameHost ? '_blank' : ''}>
            <div className="w-full max-w-xs max-h-sm flex flex-col gap-1 justify-between bg-black/20 rounded-xl pointer-events-none">
                {metadata.image && <img className="rounded-t-xl" src={metadata.image} alt="" />}
                <label className="text-base px-2" htmlFor="title">{metadata.title}</label>
                <p className="mb-auto truncate px-2 pb-2">{metadata.description}</p>
                <p className="mb-auto truncate px-2 pb-2 text-white/30">{attachment.host}</p>
            </div>
        </Link>
    )
}

export default UrlAttachment