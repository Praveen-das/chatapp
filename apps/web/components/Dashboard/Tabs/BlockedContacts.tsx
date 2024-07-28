'use client'

import React from 'react'
import useSocket from '../../../context/SocketProvider'
import { useStore } from '../../../store/global'
import useAuth from '../../../hooks/useAuth'

const contacts = new Array(15).fill(null)

function BlockedContacts() {
  const setModal = useStore(s => s.setModal)
  const { user } = useAuth()
  const { blockedUsers, sendUserUnBlockRequest } = useSocket()

  function toggleModal() {
    setModal({ activeModal: 'addBlockedContactModal' });
    document.querySelector<HTMLDialogElement>('#action-modal')?.showModal()
  }

  function handleUnblockingUser(selectedUser: IUser) {
    const req = { userId: user?.id!, blockedId: selectedUser.id, }
    sendUserUnBlockRequest(req)
  }

  return (
    <div className="h-full flex flex-col gap-4 px-4">
      <div onClick={toggleModal} className='btn btn-md '>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
        Add blocked contact
      </div>
      <div className='grid pb-2 gap-2 overflow-y-scroll no-scrollbar'>
        {
          contacts.map((user) => (
            <div className='hover:bg-base-100 flex items-center justify-between gap-4 w-full p-3 rounded-2xl'>
              <div className='size-10 bg-slate-100 rounded-full'></div>
              <div className='flex flex-col w-full flex-1'>
                <label className='text-sm' htmlFor="username">Aasdas adasdads</label>
                <label className='text-xs text-white/50' htmlFor="username">1654322435</label>
              </div>
              <div onClick={() => handleUnblockingUser(user)} tabIndex={0} className='btn btn-circle btn-ghost btn-sm' >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
              </div>
            </div>
          ))
        }
      </div>
    </div >
  )
}

export default BlockedContacts