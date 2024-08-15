'use client'
import { useEffect } from 'react'
import { redirect } from 'next/navigation';
import getLocalStorage from '../../lib/localStorage';
import App from '../../components/App';

function page({ params: { invitationId } }: { params: { invitationId: string } }) {

    useEffect(() => {
        if (invitationId) getLocalStorage()?.setItem('invitationId', invitationId)
        redirect('/')
    }, [invitationId])

    return null
}

export default page
