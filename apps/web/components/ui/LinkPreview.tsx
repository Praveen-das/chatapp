import {  parseUrl } from "../../helpers/helpers";

export default function LinkPreview({ metadata, link }: { metadata: IUrlMetadata, link?: string }) {
    if (!link) return 'no link'
    let parsedUrl = parseUrl(link)

    return (
        <div className="flex bg-black/20 h-max rounded-2xl overflow-hidden">
            {metadata.image && <img className="w-[150px]" src={metadata.image} alt="" />}
            <div className="grid gap-1 min-w-0 w-full rounded-xl p-2 pointer-events-none">
                <label className="text-base px-2 line-clamp-2" htmlFor="title">{metadata.title}</label>
                <p className="mb-auto text-sm px-2 line-clamp-2">{metadata.description}</p>
                <p className="mb-auto text-sm text-white/30 truncate px-2 pb-2">{parsedUrl?.host}</p>
            </div>
        </div>
    )
}