import { useEffect } from "react";

export default function LinkPreview({ metadata }: { metadata: IUrlMetadata }) {
    

    return <div className="flex bg-black/20 rounded-2xl">
        {metadata.image && <img className="rounded-xl w-[200px]" src={metadata.image} alt="" />}
        <div className="min-w-0 w-full max-h-sm flex-0 flex flex-col gap-1 justify-between rounded-xl p-2 pointer-events-none">
            <label className="text-base px-2 line-clamp-2" htmlFor="title">{metadata.title}</label>
            <p className="mb-auto text-sm px-2 line-clamp-2">{metadata.description}</p>
            <p className="mb-auto text-sm text-white/30 truncate px-2 pb-2">{metadata.host}</p>
        </div>
    </div>;
}