'use client'
import { useEffect } from 'react'
import App from '../components/App'
import { useStore } from '../store/global'
import getLocalStorage from '../lib/localStorage'

export default function page() {
  const setModal = useStore(s => s.setModal)

  useEffect(() => {
    const invitationId = getLocalStorage()?.getItem('invitationId')

    if (invitationId) {
      setModal({ activeModal: 'joinGroupModal', state: invitationId });
      document.querySelector<HTMLDialogElement>('#action-modal')?.showModal()
    }

  }, [])

  return <App />
}

