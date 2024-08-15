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
import Modal from '../ui/Modal'


function LinkManagement({selectedConversation}:{selectedConversation:IGroupConversation}) {
  const setConversation = useConversationStore(s => s.setConversation)
  const setModal = useStore(s => s.setModal)

  const setProfileTab = useStore(s => s.setProfileTab)
  const { initialTab } = useTabs()

  function handleSendingInvitationLink() {
    setModal({ activeModal: 'sendLinkModal', state: [{ id: '', message: `http://localhost:3000/${selectedConversation.invitationId}` }] });
    (document?.getElementById('action-modal') as HTMLDialogElement)?.showModal()
  }

  function handleCopyingLink() {
    navigator.clipboard.writeText(`http://localhost:3000/${selectedConversation.invitationId}`)
  }

  function handleGeneratingInvitationLink() {
    axiosClient.patch('/group/generateInvitationId', { conversationId: selectedConversation.id })
      .then(res => setConversation(res.data))
      .catch(res => console.log(res))
  }

  return (
    <>
      <Modal />
      <div className={`flex-1 w-[calc((100vw-(1rem*2))/3)] h-full flex flex-col bg-gradient-to-t from-base-100 rounded-2xl overflow-hidden`}>
        <div className='min-h-16 w-full flex items-center gap-4 px-4'>
          <button onClick={() => setProfileTab(initialTab)} className={`btn btn-sm btn-ghost btn-circle`} >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <label htmlFor="contact info">Invite via link</label>
        </div>
        {
          selectedConversation.invitationId ?
            <>
              <div className='flex gap-6 text-sm flex-col overflow-y-scroll py-6 no-scrollbar'>
                {/* profile */}
                <div className='w-full flex px-8 gap-4 items-center '>
                  <Avatar size='50px' onlineIndication={false} />
                  <div className='grid w-full'>
                    {selectedConversation.displayName}
                    <p className='text-xs btn-link text-left'>http://localhost:3000/{selectedConversation.invitationId}</p>
                  </div>
                </div>
                <div className='flex gap-1 flex-col w-full '>
                  <div className="w-full min-h-[2px] bg-black/20" />
                  <div tabIndex={0} onClick={handleSendingInvitationLink} className='hover:bg-base-200 w-full flex items-center gap-4 px-8 py-3 cursor-pointer'>
                    <div className='flex items-center justify-center w-[40px] h-[40px] bg-gray-500 rounded-full'>
                      <ForwardIcon className='text-lg fill-white' />
                    </div>
                    Send link
                  </div>
                  <div onClick={handleCopyingLink} tabIndex={0} className='hover:bg-base-200 w-full flex items-center gap-4 px-8 py-3 cursor-pointer'>
                    <div className='flex items-center justify-center w-[40px] h-[40px] bg-gray-500 rounded-full'>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    Copy link
                  </div>
                  <div onClick={handleGeneratingInvitationLink} tabIndex={0} className='hover:bg-base-200 w-full flex items-center gap-4 px-8 py-3 cursor-pointer'>
                    <div className='flex items-center justify-center w-[40px] h-[40px] bg-gray-500 rounded-full'>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </div>
                    Reset link
                  </div>
                </div>


              </div>
            </>
            :
            <>
              <p className='px-8 py-4 text-sm text-white/50'>Create secure links to invite others to your group with just one click. Share the link and build your community effortlessly!</p>
              <div tabIndex={0} onClick={handleGeneratingInvitationLink} className='hover:bg-base-200 w-full flex items-center gap-4 px-8 py-3 cursor-pointer'>
                <div className='flex items-center justify-center w-[40px] h-[40px] bg-gray-500 rounded-full'>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                </div>
                Generate link
              </div>
            </>
        }

      </div>
    </>
  )
}

export default LinkManagement