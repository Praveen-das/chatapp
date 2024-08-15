'use client'
import { useEffect } from 'react'
import { useStore } from '../store/global'
import getLocalStorage from '../lib/localStorage'
import axiosClient from '../lib/axiosClient'
import useAuth from '../hooks/useAuth'
import { useConversationStore } from '../store/conversationStore'

export default function page() {
  const setModal = useStore(s => s.setModal)
  const { user } = useAuth()
  const setSelectedConversation = useConversationStore(s => s.setSelectedConversation)

  useEffect(() => {
    (async () => {
      const invitationId = getLocalStorage()?.getItem('invitationId')

      if (invitationId) {
        await axiosClient<IGroupConversation[]>(`/group/fetch/${invitationId}`)
          .then(res => {
            const conversation = res.data[0]

            if (conversation) {
              if (conversation.members.find(m => m.id === user?.id))
                setSelectedConversation(conversation.id)
              else {
                setModal({ activeModal: 'joinGroupModal', state: conversation })
                document.querySelector<HTMLDialogElement>('#action-modal')?.showModal()
              }
            } else {
              setModal({ activeModal: 'joinGroupModal', state: null })
              document.querySelector<HTMLDialogElement>('#action-modal')?.showModal()
            }
          })
          .catch(res => {
            console.log(res)
          })
        getLocalStorage()?.removeItem('invitationId')
      }
    })()
  }, [user])

  return null
}

