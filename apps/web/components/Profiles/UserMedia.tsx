'use client'

import { useState } from 'react'
import { useAttachments } from '../../store/attachments'
import { useStore } from '../../store/global'
import { useTabs } from '../Dashboard/Tabs/Tabs'
import Link from 'next/link'
import LinkPreview from '../ui/LinkPreview'


function UserMedia({ conversation }: { conversation: IConversation }) {
    const mediaStore = useAttachments(s => s.mediaStore)
    const { initialTab } = useTabs()
    const setProfileTab = useStore(s => s.setProfileTab)

    const media = mediaStore.get(conversation.id) || {}
    const mediaList = Object.keys(media).sort((a: string, b: string) => a.localeCompare(b))
    const [tab, setTab] = useState(mediaList[0])

    return (
        <div className={`flex-1 w-[calc((100vw-(1rem*2))/3)] h-full flex flex-col bg-gradient-to-t from-base-100 rounded-2xl overflow-hidden`}>
            <div className='min-h-16 w-full flex items-center gap-4 px-4'>
                <button onClick={() => setProfileTab(initialTab)} className={`btn btn-sm btn-ghost btn-circle`} >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>
                <label htmlFor="contact info">Media</label>
            </div>
            <div role="tablist" className="tabs tabs-bordered">
                {media && mediaList.map((key) => (
                    <a key={key} onClick={() => setTab(key)} role="tab" className={`tab ${tab === key ? 'tab-active' : ''} capitalize`}>{key}</a>
                ))}
            </div>
            {tab === 'images' && <ImagePreviews media={media[tab]!} />}
            {tab === 'link' && <Links links={media[tab]!} />}
        </div>
    )
}

function Links({ links }: { links: IUrlAttachment[] }) {
    return <div className='grid gap-2 w-full overflow-y-scroll no-scrollbar p-2'>
        {links.map((metadata) => <Link className='link-hover text-sm break-all rounded-md' href={metadata.url}>
            <LinkPreview metadata={metadata} />
        </Link>)}
    </div>
}

function ImagePreviews({ media }: { media: IImageAttachment[] }) {
    const setSelectedAttachment = useAttachments(s => s.setSelectedAttachment)

    const handleClick = (image: IImageAttachment) => {
        document?.querySelector<HTMLDialogElement>('#my_modal_2')?.showModal()
        setSelectedAttachment(image);
    }

    return <div className='grid grid-cols-4 gap-1 w-full overflow-y-scroll no-scrollbar'>
        {media.map((image) => <img onClick={() => handleClick(image)} className='aspect-square object-cover cursor-pointer' src={image.thumbnail} alt="" />)}
    </div>
}

export default UserMedia