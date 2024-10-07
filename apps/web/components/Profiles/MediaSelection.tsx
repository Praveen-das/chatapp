import { useAttachments } from "../../store/attachments"
import { useStore } from "../../store/global"

function MediaSelection({ conversationId }: { conversationId: string }) {
    const setProfileTab = useStore(s => s.setProfileTab)
    const mediaStore = useAttachments(s => s.mediaStore)

    const media = mediaStore.get(conversationId) || {}
    const mediaList = Object.keys(media).sort((a: string, b: string) => a.localeCompare(b))
    const totalMedias = Object.values(media).reduce((p, c) => p + c.length, 0) || 0
    
    if (!Object.keys(media).length) return null
    return (
        <div onClick={() => setProfileTab('media')} className='bg-base-200 capitalize w-full flex items-center justify-between gap-4 px-8 py-6 cursor-pointer'>
            {mediaList.map((name, i) => name + (mediaList.length !== i + 1 ? ', ' : ''))}
            <label className='ml-auto text-base-content' htmlFor="label">{totalMedias}</label>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
        </div>
    )
}

export default MediaSelection