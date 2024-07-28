'use client'

import { useStore } from '../../store/global'
import { Avatar } from '../Dashboard/Components/Avatar'
import useSelectedConversation from '../../hooks/useSelectedConversation'
import { useTabs } from '../Dashboard/Tabs/Tabs'
import Link from 'next/link'
import ForwardIcon from "../../public/forward.svg"
import axiosClient from '../../lib/axiosClient'
import { useConversationStore } from '../../store/conversationStore'
import { useMessageStore } from '../../store/messageStore'


function UserMedia() {

    const { initialTab } = useTabs()
    const setProfileTab = useStore(s => s.setProfileTab)

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
            <div className='flex gap-6 text-sm flex-col overflow-y-scroll py-6 no-scrollbar'>
                <div className='flex gap-1 flex-col w-full '>
                </div>


            </div>
        </div>
    )
}

export default UserMedia